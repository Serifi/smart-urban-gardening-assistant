<template>
  <div>
    <Header @add-plant="addUserPlant" @search-plant="searchPlant" :plants="plants" :plantsByUser="plantsByUser"/>
    <Filter @filter-plant="filterPlant" :plants="plantsByUser" :environmental-conditions="environmentalConditions"/>

    <DataTable :value="filterPlants" v-model:expandedRows="expandedPlants" @rowExpand="onRowExpand" paginator :rowsPerPageOptions="[5,10,25]" :rows="5" resizable-columns class="mt-8 mx-8 rounded shadow-lg">
      <Column expander />
      <template #expansion="slotProps">
        <div class="flex items-center">
          <img src="../assets/images/plantExample.jpg" alt="Plant Image" class="h-[150px] rounded me-4" />
          <div class="flex flex-col space-y-4">
            <div><strong>{{ $t('distribution') }}:</strong> {{ slotProps.data.distribution }}</div>
            <div><strong>{{ $t('speciesCount') }}:</strong> {{ slotProps.data.speciesCount }}</div>
            <div><strong>{{ $t('growthHeight') }}:</strong> {{ slotProps.data.growthHeightMin }} - {{ slotProps.data.growthHeightMax }} cm</div>
            <div><strong>{{ $t('funFact') }}:</strong> {{ slotProps.data.funFact }}</div>
          </div>
        </div>
      </template>
      <Column field="name" header="Name"/>
      <Column field="latinName" header="Latin Name"/>
      <Column field="plantFamily" header="Plant Family"/>
      <Column field="floweringTime" header="Flowering Time"/>
      <Column field="status" header="Status">
        <template #body="slotProps">
          <Tag :style="{ color: slotProps.data.status === 'Ideal' ? '#B4E5B4' : (slotProps.data.status === 'Acceptable' ? '#99C2FF' : '#FF9999'),
                         backgroundColor: slotProps.data.status === 'Ideal' ? '#D6F3D6' : (slotProps.data.status === 'Acceptable' ? '#CCE5FF' : '#FFCCCC') }">
            {{slotProps.data.status}}
          </Tag>
        </template>
      </Column>
      <Column>
        <template #body="slotProps">
            <i class="pi pi-times text-red-400 cursor-pointer" @click="confirmDeletion($event, slotProps.data.ID)"/>
        </template>
      </Column>
    </DataTable>
    <ConfirmPopup/>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useConfirm } from "primevue/useconfirm"
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import Header from "../components/Header.vue"
import Filter from "../components/Filter.vue"
import axios from 'axios'

const store = useStore()
const router = useRouter()
const searchInput = ref('')
const plants = ref([])
const plantsByUser = ref([])
const userPlant = ref([])
const expandedPlants = ref([])
const environmentalConditions = ref([
  { name: 'Temperature', unit: '°C', value: 20, icon: ['fas', 'thermometer-half'], iconColor: '#FF9999' },
  { name: 'Humidity', unit: '%', value: 65, icon: ['fas', 'tint'], iconColor: '#99C2FF' },
  { name: 'Light Intensity', unit: 'Lux', value: 1800, icon: ['fas', 'sun'], iconColor: '#FFF699' }]) // Hier werden die Umweltbedingungsdaten aus der Tabelle "environmentalcondition" gespeichert
const environmentalConditionByPlant = ref([])
const filterChosen = ref(-1)
const filterPlant = (newValue) => filterChosen.value = newValue
const onRowExpand = (event) => {expandedPlants.value = event.data ? [event.data] : []}
const searchPlant = (newValue) => searchInput.value = newValue

const filterPlants = computed(() => {
  return plantsByUser.value
    .filter((plant) => {
      return (
        plant.name.toLowerCase().includes(searchInput.value.toLowerCase()) &&
        ((filterChosen.value === -1) ||
        (filterChosen.value === 0 && plant.status === 'Ideal') ||
        (filterChosen.value === 1 && plant.status === 'Acceptable') ||
        (filterChosen.value === 2 && plant.status === 'Deficient'))
      )
    })
    .sort((a, b) => a.name.localeCompare(b.name))
})

const getPlants = async () => {
  try {
    const response = await axios.get(`http://localhost:3001/plants`)
    if (response.status === 200) plants.value = response.data
  } catch (error) {
    console.error('Fehler beim Get der Pflanzen:', error)
  }
}

const getUserPlant = async () => {
  try {
    const response = await axios.get(`http://localhost:3001/user/${store.getters.getUser.ID}/plants`)
    userPlant.value = response.data
    plantsByUser.value = plants.value
    //ordne entsprechende Pflanzen dem Benutzer zu, Status standardmäßig ideal
  .filter(plant => {return userPlant.value.some(up => up.plantID === plant.ID)})
  .map(plant => {return { ...plant, status: 'Ideal' }})
  } catch (error) {
    console.error('Fehler beim Get der BenutzerPflanzen:', error)
  }
}

const getEnvironmentalConditionByPlant = async () => {
  try {
    const response = await axios.get(`http://localhost:3001/environmentalConditionByPlant`)
    environmentalConditionByPlant.value = response.data
  } catch (error) {
    console.error('Fehler beim Get der Umweltbedingungen:', error)
  }
}

async function deleteUserPlant(plantId) {
  try {
    await axios.delete(`http://localhost:3001/user/${store.getters.getUser.ID}/plants/${plantId}`)
    plantsByUser.value.splice(plantsByUser.value.findIndex(plant => plant.ID === plantId), 1)
  } catch (error) {
    console.error('Fehler beim Delete der Pflanze: ' +  error)
  }
}

const confirm = useConfirm()
const confirmDeletion = (event, plantID) => {
  confirm.require({
    target: event.currentTarget,
    message: 'Do you want to remove this plant?',
    icon: 'pi pi-info-circle',
    acceptClass: 'p-button-danger p-button-sm',
    accept: () => {
      deleteUserPlant(plantID)
    }
  })
}

const addUserPlant = (plantChosen) => {
  plantsByUser.value.push(...plantChosen)
  plantsByUser.value.forEach(plant => !plant.status && (plant.status = 'Ideal'))
}

function setStatus() {
  plantsByUser.value.forEach((plant) => {
    const matchingCondition = environmentalConditionByPlant.find((condition) => condition.plantID === plant.ID)

    let status = "Deficient"
    if (
      humidity >= matchingCondition.idealHumMin && humidity <= matchingCondition.idealHumMax &&
      lightIntensity >= matchingCondition.idealLightMin && lightIntensity <= matchingCondition.idealLightMax &&
      temperature >= matchingCondition.idealTempMin && temperature <= matchingCondition.idealTempMax
    ) status = "Ideal"
    else if (
      humidity >= matchingCondition.acceptHumMin && humidity <= matchingCondition.acceptHumMax &&
      lightIntensity >= matchingCondition.acceptLightMin && lightIntensity <= matchingCondition.acceptLightMax &&
      temperature >= matchingCondition.acceptTempMin && temperature <= matchingCondition.acceptTempMax
    ) status = "Acceptable"

    plant.status = status
  })
}

onMounted(async () => {
  if (!store.getters.getUser) router.push('/start')
  else {
    await getPlants()
    await getUserPlant()
    await getEnvironmentalConditionByPlant()
    try {
      const response = await axios.get('http://192.168.178.31:80/environmentalCondition')
      environmentalConditions.value[2].value = response.data.lightIntensity
      environmentalConditions.value[1].value = response.data.humidity
      environmentalConditions.value[0].value = response.data.temperature
      setStatus()
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
})
</script>

<style>
.p-datatable .p-datatable-thead > tr > th {
  background-color: #E0F9E0 !important;
}

.p-confirm-popup-accept,
.p-confirm-popup-reject {
  padding: 4px;
  margin: 4px;
}

.p-confirm-popup-accept{
  background-color: #FF9999 !important;
}
</style>
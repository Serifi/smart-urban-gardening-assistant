<template>
  <div>
    <div class="flex justify-between items-center bg-plantGreen p-4">
    <div class="text-2xl font-bold lg:hidden">SUGA</div>
    <div class="text-2xl font-bold hidden lg:block">Smart Urban Gardening Assistant</div>
    <div class="flex space-x-4 items-center">
      <div class="relative">
        <i class="absolute pi pi-search left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
        <InputText v-model="searchInput" :placeholder="$t('search')" class="border ps-10 py-2 px-4 rounded"/>
      </div>

      <MultiSelect v-model="plantChosen" :options="plantOptions" :placeholder="$t('plants')" optionLabel="name" display="chip"
                    class="border px-4 rounded" :filter="true" :showToggleAll="false" :maxSelectedLabels="3">
        <template #footer>
            <Button type="button" @click="addUserPlant" class="w-full bg-plantGreen p-2">
              <div class="flex items-center space-x-2 mx-auto">
                <i class="pi pi-plus text-white"></i>
                <div class="text-white font-bold text-l">{{ $t('plants') }}</div>
              </div>
            </Button>
        </template>
      </MultiSelect>

      <div class=" w-[40px] h-[40px] bg-white flex rounded items-center justify-center">
        <i class="pi pi-language cursor-pointer text-[20px]" @click="showLanguagePanel" />
      </div>
      <div class=" w-[40px] h-[40px] bg-white flex rounded items-center justify-center">
        <i class="pi pi-user cursor-pointer text-[20px]" @click="showSettingsPanel"/>
      </div>
    </div>
  </div>

  <OverlayPanel ref="languagePanel" appendTo="body">
    <div v-for="language in languages" :key="language.code" @click="selectLanguage(language)"
          class="flex items-center space-x-2 p-2 rounded hover:bg-gray-200 transition duration-300">
      <country-flag :country='language.code' size='small'/>
      <span class="me-2 cursor-pointer">{{ language.name }}</span>
    </div>
  </OverlayPanel>

  <OverlayPanel ref="settingsPanel" appendTo="body">
    <div class="flex flex-col">
      <div class="flex items-center p-2 rounded hover:bg-gray-200 transition duration-300 cursor-pointer" @click="showSettings = true">
        <i class="pi pi-cog pi-fw me-2"/> {{ $t('settings') }}
      </div>
      <div class="flex items-center p-2 rounded hover:bg-gray-200 transition duration-300 cursor-pointer"  @click="router.push('/start')">
        <i class="pi pi-power-off pi-fw text-red-400 me-2"/> {{ $t('logout') }}
      </div>
    </div>
  </OverlayPanel>

  <Dialog v-model:visible="showSettings" modal :draggable="false"  header="Settings" :style="{ width: '33vw' }">
    <div class="flex-col space-y-8">
      <div class="flex-col space-y-4">
        <div class="flex flex-col space-y-2">
          <label for="oldPassword" class="font-bold">{{ $t('oldPassword') }}</label>
          <Password id="oldPassword" v-model="oldPassword" toggleMask :feedback="false" class="border rounded"/>
        </div>
        <div class="flex flex-col space-y-2">
          <label for="newPassword" class="font-bold">{{ $t('newPassword') }}</label>
          <Password id="newPassword" v-model="newPassword" toggleMask class="border rounded">
            <template #header>
              <div class="font-bold">{{ $t('passwordSuggestions') }}</div>
            </template>
            <template #footer>
              <ul>
                <li>{{ $t('passwordLength') }}</li>
                <li>{{ $t('passwordNumeric') }}</li>
                <li>{{ $t('passwordCase') }}</li>
              </ul>
            </template>
          </Password>
        </div>
        <div class="flex flex-col space-y-2">
          <label for="newPasswordRepeat" class="font-bold">{{ $t('newPassword') }}</label>
          <Password id="newPasswordRepeat" v-model="newPasswordRepeat" toggleMask :feedback="false" class="border rounded"/>
        </div>
      </div>
      <Button @click="updatePassword" :disabled="disableButton" class="w-full bg-plantGreen text-center rouneded p-4">
        <div class="flex items-center space-x-2 mx-auto">
          <i class="pi pi-user text-white"/>
          <div class="text-white text-l font-bold"> {{ $t('updatePassword') }} </div>
        </div>
      </Button>
      <Button @click="confirmDeletion($event)" class="w-full bg-red-400 text-center rouneded p-4">
        <div class="flex items-center space-x-2 mx-auto">
          <i class="pi pi-trash text-white"/>
          <div class="text-white text-l font-bold"> {{ $t('deleteAccount') }} </div>
        </div>
      </Button>
      <Message v-if="wrongOldPassword" severity="error" :closable="false">{{ $t('wrongOldPassword') }}</Message>
      <Message v-else-if="newPasswordLikeOldPasswort" severity="error" :closable="false">{{ $t('newPasswordLikeOldPasswort') }}</Message>
      <Message v-else-if="newPasswordsNotMatching" severity="error" :closable="false">{{ $t('newPasswordsNotMatching') }}</Message>
    </div>
  </Dialog>
  </div>  
</template>

<script setup>
import { ref, watch, watchEffect } from 'vue'
import { useConfirm } from "primevue/useconfirm"
import { useRouter } from "vue-router"
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

const emit = defineEmits(["add-plant", "search-plant"])
const props = defineProps(['plants', 'plantsByUser'])

const { locale } = useI18n()
const confirm = useConfirm()
const store = useStore()
const router = useRouter()
const searchInput = ref('')
const showSettings = ref(false)
const languagePanel = ref(null)
const settingsPanel = ref(null)
const oldPassword = ref()
const newPassword = ref()
const newPasswordRepeat = ref()
const wrongOldPassword = ref(false)
const newPasswordLikeOldPasswort = ref(false)
const newPasswordsNotMatching = ref(false)
const disableButton = ref(true)
const plantChosen = ref([])
const plantOptions = ref([])
props.plants.sort((a, b) => a.name.localeCompare(b.name))
const languages = ref([{ code: 'de', name: 'German', locale: 'de' },{ code: 'gbr', name: 'English', locale: 'en' }])

const showLanguagePanel = () => {languagePanel.value.toggle(event)}
const showSettingsPanel = () => {settingsPanel.value.toggle(event)}
function selectLanguage(language) {
  locale.value = language.locale
  showLanguagePanel()
}

async function addUserPlant() {
  try {
    for (const plant of plantChosen.value) await axios.post(`http://localhost:3001/user/${store.getters.getUser.ID}/plants/${plant.ID}`)
    emit("add-plant", plantChosen.value)
    plantChosen.value = []
  } catch (error) {
    console.error('Fehler beim Post der Pflanze:', error)
  }
}

async function updatePassword() {
  wrongOldPassword.value = false
  newPasswordLikeOldPasswort.value = false
  newPasswordsNotMatching.value = false

  if (store.getters.getUser.password !== oldPassword.value) {
    wrongOldPassword.value = true
    return
  }

  if (newPassword.value !== newPasswordRepeat.value) {
    newPasswordsNotMatching.value = true
    return
  }

  if (newPassword.value === oldPassword.value) {
    newPasswordLikeOldPasswort.value = true
    return
  }

  try {
    const response = await axios.put(`http://localhost:3001/users/${store.getters.getUser.ID}/password`, {
      password: newPassword.value
    })

    if (response.status === 200) showSettings.value = false //Passwort aktualisiert
    else console.error('Fehler beim Put des Passworts:', response.statusText)

  } catch (error) {
    console.error('Fehler beim Update des Passworts:', error)
  }
}

const confirmDeletion = (event) => {
  confirm.require({
    target: event.currentTarget,
    message: 'Do you want to delete your account?',
    icon: 'pi pi-info-circle',
    acceptClass: 'p-button-danger p-button-sm',
    accept: deleteUser
  })
}

async function deleteUser() {
  try {
    const response = await axios.delete(`http://localhost:3001/users/${store.getters.getUser.ID}`)
    if(response.status === 200) router.push('/start')
  } catch (error) {
    console.error('Fehler beim Delete des Benutzers:', error)
  }
}

watchEffect(() => {
  if (props.plants.length > 0) {
    plantOptions.value = [...props.plants]
      .filter(plant => !props.plantsByUser.some(userPlant => userPlant.ID === plant.ID))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
})
watch([oldPassword, newPassword, newPasswordRepeat], () => disableButton.value = !oldPassword.value || !newPassword.value || !newPasswordRepeat.value)
watch(searchInput, (newValue) => {emit("search-plant", newValue)})
</script>
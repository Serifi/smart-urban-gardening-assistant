<template>
    <div class="flex">
      <div class="lg:w-[66%]">
        <div class="text-slate-400 p-4 overflow-y-auto text-justify mx-4">
          {{ $t('mainDescription') }} 🌱
        </div>

        <!-- FILTER -->
        <div class="flex lg:flex-row flex-col ms-8 lg:ms-4">
          <div v-for="(card, index) in filterOptions" :key="index" class="flex-1 lg:mx-4 my-4">
            <Card
              class="flex flex-row rounded py-4 px-6" shadow hover
              :class="{ 'bg-[#E0F9E0]': filterChosen === index }"
              @click="toggleFilter(index)">
              <div class="flex items-center">
                <font-awesome-icon :icon="card.icon" class="text-[32px]" :style="{ 'color': card.iconColor }" />
                <div class="mx-4 h-full border-l border-gray" />
                <div class="flex flex-col">
                  <div class="text-sm">{{ card.name }}</div>
                  <div class="text-2xl font-bold">{{ card.count }}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <!-- CONDITIONS -->
      <div class="lg:w-[33%] flex lg:flex-row flex-col mb-4">
        <div v-for="(card, index) in props.environmentalConditions" :key="index" class="flex-1 mx-4 mt-6">
          <Card class="flex flex-col justify-center text-center bg-white rounded py-4 px-6 h-full" shadow>
            <font-awesome-icon :icon="card.icon" class="text-[32px] mb-4" :style="{'color': card.iconColor }"/>
            <div class="border-b border-gray my-2"></div>
            <div class="text-sm">{{ card.name }}</div>
            <div class="text-2xl font-bold">{{ card.value }}{{ card.unit }}</div>
          </Card>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

const emit = defineEmits(["filter-plant"])
const props = defineProps(['plants', 'environmentalConditions'])

const filterChosen = ref(-1)
const filterOptions = ref([
  { name: 'Ideal', count: 0, icon: ['fas', 'fa-check-circle'], iconColor: '#B4E5B4' },
  { name: 'Acceptable', count: 0, icon: ['fas', 'fa-adjust'], iconColor: '#99C2FF' },
  { name: 'Deficient', count: 0, icon: ['fas', 'fa-exclamation-circle'], iconColor: '#FF9999'}
])

const toggleFilter = (index) => {filterChosen.value = filterChosen.value === index ? -1 : index}
const updateFilter = () => filterOptions.value.forEach((option) => option.count = props.plants.filter((plant) => plant.status === option.name).length)

onMounted(() => {updateFilter()})
watch(() => props.plants, () => {updateFilter()}, { deep: true })
watch(filterChosen, (newValue) => {emit("filter-plant", newValue)})
</script>
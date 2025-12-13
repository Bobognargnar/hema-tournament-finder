<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Header -->
    <q-header elevated class="bg-blue-grey-1 text-dark">
      <q-toolbar>
        <q-toolbar-title class="text-h5 text-weight-bold">
          <q-icon name="sports_kabaddi" class="q-mr-sm" />
          HEMA Tournament Finder
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- Main Content -->
    <q-page-container>
      <q-page class="q-pa-md bg-grey-1">
        <div class="row q-gutter-md">
          <!-- Map and Filters Card -->
          <div class="col-12 col-md-7">
            <q-card class="full-height">
              <q-card-section>
                <div class="text-h6 q-mb-md">Tournament Locations</div>
                
                <!-- Filters Card -->
                <q-card flat bordered class="q-mb-md bg-blue-grey-1">
                  <q-card-section>
                    <div class="text-subtitle2 q-mb-sm">Filters</div>
                    <div class="row q-gutter-md">
                      <div class="col-12 col-sm-6">
                        <q-input
                          v-model="filters.startDate"
                          type="date"
                          label="Start Date"
                          outlined
                          dense
                        />
                      </div>
                      <div class="col-12 col-sm-6">
                        <q-input
                          v-model="filters.endDate"
                          type="date"
                          label="End Date"
                          outlined
                          dense
                        />
                      </div>
                      <div class="col-12">
                        <q-select
                          v-model="filters.discipline"
                          :options="disciplineOptions"
                          label="Discipline"
                          outlined
                          dense
                          multiple
                          use-chips
                        />
                      </div>
                    </div>
                    <div class="row q-mt-sm">
                      <q-btn 
                        @click="applyFilters" 
                        color="primary" 
                        label="Apply Filters" 
                        size="sm"
                      />
                      <q-btn 
                        @click="clearFilters" 
                        flat 
                        label="Clear" 
                        size="sm" 
                        class="q-ml-sm"
                      />
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Map Container -->
                <div 
                  ref="mapContainer" 
                  class="map-container bg-grey-3"
                  style="height: 400px; border-radius: 4px;"
                >
                  <div class="absolute-center text-grey-6">
                    <q-icon name="map" size="3rem" />
                    <div class="text-body2 q-mt-sm">OpenLayers Map</div>
                    <div class="text-caption">Tournament locations will appear here</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Tournament List Card -->
          <div class="col-12 col-md-5">
            <q-card class="full-height">
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  Tournaments ({{ filteredTournaments.length }})
                </div>
                
                <q-scroll-area style="height: 500px;">
                  <div class="q-gutter-sm">
                    <q-card 
                      v-for="tournament in filteredTournaments" 
                      :key="tournament.id"
                      flat 
                      bordered
                      class="tournament-card cursor-pointer"
                      @click="selectTournament(tournament)"
                    >
                      <q-card-section horizontal>
                        <q-card-section class="col-4">
                          <q-img
                            :src="tournament.image"
                            class="rounded-borders"
                            style="height: 80px;"
                            fit="cover"
                          >
                            <template v-slot:error>
                              <div class="absolute-full flex flex-center bg-grey-3">
                                <q-icon name="image" size="2rem" color="grey-6" />
                              </div>
                            </template>
                          </q-img>
                        </q-card-section>

                        <q-card-section class="col-8">
                          <div class="text-subtitle2 text-weight-bold">
                            {{ tournament.name }}
                          </div>
                          <div class="text-caption text-grey-6 q-mb-xs">
                            {{ tournament.location }}
                          </div>
                          <div class="text-body2 q-mb-xs">
                            <q-icon name="event" size="sm" class="q-mr-xs" />
                            {{ formatDate(tournament.date) }}
                          </div>
                          <div class="text-body2">
                            <q-chip 
                              v-for="discipline in tournament.disciplines" 
                              :key="discipline"
                              size="sm" 
                              color="primary" 
                              text-color="white"
                              class="q-mr-xs"
                            >
                              {{ discipline }}
                            </q-chip>
                          </div>
                        </q-card-section>
                      </q-card-section>
                    </q-card>
                  </div>
                </q-scroll-area>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-page>
    </q-page-container>

    <!-- Footer -->
    <q-footer class="bg-blue-grey-1 text-dark">
      <q-toolbar>
        <q-space />
        
        <!-- Login Section -->
        <div class="q-mr-lg">
          <q-btn 
            flat 
            icon="login" 
            label="Login" 
            @click="showLogin = true"
          />
        </div>
        
        <!-- My Tournaments Section -->
        <div>
          <q-btn 
            flat 
            icon="bookmark" 
            label="My Tournaments" 
            @click="showMyTournaments = true"
          />
        </div>
      </q-toolbar>
    </q-footer>

    <!-- Login Dialog -->
    <q-dialog v-model="showLogin">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Login</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="loginForm.email" label="Email" outlined />
          <q-input 
            v-model="loginForm.password" 
            label="Password" 
            type="password" 
            outlined 
            class="q-mt-md"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showLogin = false" />
          <q-btn color="primary" label="Login" @click="login" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- My Tournaments Dialog -->
    <q-dialog v-model="showMyTournaments">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">My Tournaments</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body2 text-grey-6">
            Your registered tournaments will appear here.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" @click="showMyTournaments = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Reactive data
const tournaments = ref([])
const filters = ref({
  startDate: '',
  endDate: '',
  discipline: []
})

const showLogin = ref(false)
const showMyTournaments = ref(false)
const loginForm = ref({
  email: '',
  password: ''
})

// Discipline options for filter
const disciplineOptions = [
  'Longsword',
  'Rapier',
  'Rapier & Dagger',
  'Sabre',
  'Smallsword',
  'Dagger',
  'Sword & Buckler',
  'Messer',
  'Polearms',
  'Sidesword',
  'Sidesword & Buckler',
  'Sidesword & Dagger',
  'Sidesword & Rotella',
  
]

// Mock API data
const mockTournaments = [
  {
    id: 1,
    name: 'European HEMA Championships',
    location: 'Vienna, Austria',
    date: '2024-06-15',
    disciplines: ['Longsword', 'Rapier'],
    image: '/placeholder.svg?height=80&width=120',
    coordinates: [16.3738, 48.2082]
  },
  {
    id: 2,
    name: 'Swordfish Tournament',
    location: 'Gothenburg, Sweden',
    date: '2024-07-20',
    disciplines: ['Longsword', 'Sabre'],
    image: '/placeholder.svg?height=80&width=120',
    coordinates: [11.9746, 57.7089]
  },
  {
    id: 3,
    name: 'Fechtschule America',
    location: 'Chicago, USA',
    date: '2024-08-10',
    disciplines: ['Longsword', 'Dagger', 'Messer'],
    image: '/placeholder.svg?height=80&width=120',
    coordinates: [-87.6298, 41.8781]
  },
  {
    id: 4,
    name: 'Rapier Masters Cup',
    location: 'Florence, Italy',
    date: '2024-09-05',
    disciplines: ['Rapier', 'Smallsword'],
    image: '/placeholder.svg?height=80&width=120',
    coordinates: [11.2558, 43.7696]
  },
  {
    id: 5,
    name: 'Nordic Steel',
    location: 'Oslo, Norway',
    date: '2024-10-12',
    disciplines: ['Longsword', 'Sword & Buckler'],
    image: '/placeholder.svg?height=80&width=120',
    coordinates: [10.7522, 59.9139]
  }
]

// Computed properties
const filteredTournaments = computed(() => {
  let filtered = tournaments.value

  if (filters.value.startDate) {
    filtered = filtered.filter(t => t.date >= filters.value.startDate)
  }

  if (filters.value.endDate) {
    filtered = filtered.filter(t => t.date <= filters.value.endDate)
  }

  if (filters.value.discipline.length > 0) {
    filtered = filtered.filter(t => 
      t.disciplines.some(d => filters.value.discipline.includes(d))
    )
  }

  return filtered
})

// Methods
const fetchTournaments = async () => {
  // Simulate API call
  setTimeout(() => {
    tournaments.value = mockTournaments
  }, 500)
}

const applyFilters = () => {
  // Filters are applied automatically through computed property
  console.log('Filters applied:', filters.value)
}

const clearFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    discipline: []
  }
}

const selectTournament = (tournament) => {
  console.log('Selected tournament:', tournament)
  // Here you could navigate to tournament details or show more info
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

const login = () => {
  console.log('Login attempt:', loginForm.value)
  showLogin.value = false
  // Implement actual login logic here
}

// Lifecycle
onMounted(() => {
  fetchTournaments()
})
</script>

<style scoped>
.tournament-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

.map-container {
  position: relative;
  border: 1px solid #e0e0e0;
}
</style>

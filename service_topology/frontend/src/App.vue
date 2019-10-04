<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>DisTrace | </span>
        <span class="font-weight-light">The worst observability service</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text href="/">
        <span class="mr-2">Home</span>
        <v-icon>fas fa-external-link-alt</v-icon>
      </v-btn>
    </v-app-bar>

    <v-content>
      <router-view/>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class App extends Vue {}
</script>

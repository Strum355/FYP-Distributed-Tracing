<template>
    <div>
        <v-container fluid>    
            <v-row>
                <v-col cols="12">
                    <v-slider color="black" label="Time"></v-slider>
                    <div id="graph"></div>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script lang="ts" src="./topologyGraph.ts"></script>

<style lang="scss">
svg {
    margin: 0 auto;
}

#graph {
    display: flex;
    justify-content: center;
}
</style>
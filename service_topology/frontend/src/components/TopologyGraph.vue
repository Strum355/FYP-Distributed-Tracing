<template>
    <div>
        <v-container fluid>    
            <v-row>
                <v-col lg="2" sm="4">
                    <v-text-field value="6ebde5170cd7fdb1" v-on:keyup.enter="findTrace($event)" id="trace-id" label="Trace ID"></v-text-field>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="12">
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
    border: 1px solid gainsboro;
}

#trace-id {
    font-family: monospace;
}

main {
    background-color: rgb(249, 255, 255)
}

</style>
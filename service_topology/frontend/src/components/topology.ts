import ForceGraph from 'force-graph'
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Topology extends Vue {
  public mounted() {
    let node1: ForceGraph.GraphNode = {id: 'Myriel', name: 'burger', val: ''}
    let node2: ForceGraph.GraphNode = {id: 'Blop', name: 'burger', val: ''}

    let data: ForceGraph.GraphData = {
      nodes: [
        node1, node2,
      ],
      links: [
        {source: node1, target: node2, type: 'bepis'},
      ]
    }

    ForceGraph()(this.$el as HTMLElement).graphData(data).onNodeClick((node: ForceGraph.GraphNode) => {
      console.log(node.id)
    })
  }
}

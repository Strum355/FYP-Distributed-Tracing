import ForceGraph from 'force-graph'
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class TopologyGraph extends Vue {
  public mounted() {
    const node1: ForceGraph.GraphNode = {id: 'Myriel', name: 'burger', val: ''}
    const node2: ForceGraph.GraphNode = {id: 'Blop', name: 'burger', val: ''}

    const data: ForceGraph.GraphData = {
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

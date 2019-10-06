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

    const graph = ForceGraph()(document.getElementById('graph')!!)
    graph.width(800).height(500)
    graph.graphData(data).onNodeClick((node: ForceGraph.GraphNode) => {
      console.log(node.id)
    })
  }
}

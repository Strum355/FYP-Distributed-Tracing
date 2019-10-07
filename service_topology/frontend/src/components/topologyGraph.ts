import ForceGraph from 'force-graph'
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class TopologyGraph extends Vue {
  public mounted() {
    const node1: ForceGraph.GraphNode = {id: 'mysql', name: 'mysql', val: ''}
    const node2: ForceGraph.GraphNode = {id: 'redis', name: 'redis', val: ''}
    const node3: ForceGraph.GraphNode = {id: 'backend', name: 'backend', val: ''}

    const data: ForceGraph.GraphData = {
      nodes: [
        node1, node2, node3,
      ],
      links: [
        // @ts-ignore
        {source: node3, target: node2, type: ''},
        // @ts-ignore
        {source: node3, target: node1, type: ''},
      ]
    }

    const graph = ForceGraph()(document.getElementById('graph')!!)
    graph.width(800).height(500)
    graph.graphData(data).onNodeClick((node: ForceGraph.GraphNode) => {
      // @ts-ignore
      graph.emitParticle(graph.graphData().links[0] as ForceGraph.GraphLinkObject)
    })
  }
}

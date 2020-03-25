import { Span, Trace } from '@/models/Trace'
import ForceGraph from 'force-graph'
import gql from 'graphql-tag'
import { Component, Vue, Watch } from 'vue-property-decorator'

@Component({})
export default class TopologyGraph extends Vue {

  public graph?: ForceGraph.ForceGraphInstance = undefined

  private spanIDtoSpan: Map<string, Span> = new Map()
  private spanToNode: Map<string, ForceGraph.GraphNode> = new Map()
  private serviceToNode: Map<string, ForceGraph.GraphNode> = new Map()
  private links: Map<string, ForceGraph.GraphLink> = new Map()
  public trace: Trace | null = null

  public minTime = 0
  public maxTime = 100

  @Watch('trace')
  public updateMaxTime(newVal: Trace, oldVal: Trace) {
    this.maxTime = Math.floor((this.trace!!.spans[this.trace!!.spans.length-1].startTime - this.trace!!.spans[0].startTime)/1000)
    this.minTime = 0
  } 

  public onSlide(i: number) {
    
  }

  public mounted() {
    this.graph = ForceGraph()(document.getElementById('graph')!!)
    /* this.graph.width(document.getElementById('graph')!!.offsetWidth)
    this.graph.height(document.getElementById('graph')!!.offsetHeight) */
    this.graph.width(1800)
    this.graph.height(800)
    this.graph.onNodeClick((node: ForceGraph.GraphNode) => {
      // @ts-ignore
      graph.emitParticle(graph.graphData().links[0] as ForceGraph.GraphLinkObject)
    })
  }

  public async findTrace(event: Event) {
    this.spanIDtoSpan.clear()
    this.spanToNode.clear()
    this.serviceToNode.clear()
    
    const query = gql`
      query findTrace($traceID: String!) {
        findTrace(traceID: $traceID) {
          traceID
          spans {
            spanID
            startTime
            serviceName
            parentSpanID
            operationName
          }
        }
      }
    `
    const resp = await this.$apollo.query({query: query, fetchPolicy: 'no-cache', variables: {
      traceID: (event.srcElement as HTMLInputElement).value
    }})
    
    this.trace = resp.data['findTrace'] as Trace

    this.populateSpanMap(this.trace)
    const nodes = this.computeNodes(this.trace)
    const links = this.computeLinks(this.trace)

    /* console.log(nodes)
    console.log(links) */

    this.graph!!.graphData({nodes: nodes, links: links})
  }

  private populateSpanMap(trace: Trace) {
    for(let span of trace.spans) {
      this.spanIDtoSpan.set(span.spanID, span)
    }
  }

  private computeNodes(trace: Trace): ForceGraph.GraphNode[] {
    // create a list of spans "grouped" by service name to create a node per service
    // TODO: allow user to choose what to base nodes off
    const uniqueSpans = trace.spans.filter((s, i, a) => i == trace.spans.findIndex(s1 => s1.serviceName == s.serviceName))
    const nodes: ForceGraph.GraphNode[] = []

    // for each unique service, create a node
    for(const span of uniqueSpans) {
      const node: ForceGraph.GraphNode = {
        id: span.spanID,
        name: span.serviceName,
      }
  
      this.serviceToNode.set(span.serviceName, node)
      nodes.push(node)
    }

    // collect all spans and point them to their associated node, currently by serviceName
    for(const span of trace.spans) {
      const node = this.serviceToNode.get(span.serviceName)!!
      this.spanToNode.set(span.spanID, node)
    }

    return nodes
  }

  private computeLinks(trace: Trace): ForceGraph.GraphLink[] {
    const links: ForceGraph.GraphLink[] = []
    this.links.clear()

    let i = 0
    // for all spans that have a parentSpanID, find the node of that parentSpanID
    // and create a link from the node for spanID to that parent node
    for(const span of trace.spans) {
      if(span.parentSpanID != "0" && span.parentSpanID != undefined) {
        const parentSpanNode = this.spanToNode.get(span.parentSpanID!!)!!
        const childSpanNode = this.spanToNode.get(span.spanID)!!
        const link: ForceGraph.GraphLink = {
          id: (++i).toString(),
          source: parentSpanNode,
          target: childSpanNode,
          type: '',
        }

        if(!this.links.has(`${parentSpanNode.name}$${childSpanNode.name}`)) {
          links.push(link)
          this.links.set(`${parentSpanNode.name}$${childSpanNode.name}`, link)
        }
      }
    }

    return links
  }
}

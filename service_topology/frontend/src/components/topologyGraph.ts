import { Span, Trace } from '@/models/Trace';
import ForceGraph from 'force-graph';
import gql from 'graphql-tag';
import { Component, Vue } from 'vue-property-decorator';

@Component({})
export default class TopologyGraph extends Vue {

  public graph?: ForceGraph.ForceGraphInstance = undefined

  private spanIDtoSpan: Map<string, Span> = new Map()
  private spanToNode: Map<string, ForceGraph.GraphNode> = new Map()
  private serviceToNode: Map<string, ForceGraph.GraphNode> = new Map()

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
    
    const trace = resp.data['findTrace'] as Trace

    this.populateSpanMap(trace)
    const nodes = this.computeNodes(trace)
    const links = this.computeLinks(trace)

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
    for(let span of uniqueSpans) {
      let node: ForceGraph.GraphNode = {
        id: span.spanID,
        name: span.serviceName,
      }
  
      this.serviceToNode.set(span.serviceName, node)
      nodes.push(node)
    }

    // collect all spans and point them to their associated node, currently by serviceName
    for(let span of trace.spans) {
      let node = this.serviceToNode.get(span.serviceName)!!
      this.spanToNode.set(span.spanID, node)
    }

    return nodes
  }

  private computeLinks(trace: Trace): ForceGraph.GraphLink[] {
    const links: ForceGraph.GraphLink[] = []

    // for all spans that have a parentSpanID, find the node of that parentSpanID
    // and create a link from the node for spanID to that parent node
    for(let span of trace.spans) {
      if(span.parentSpanID != "0" && span.parentSpanID != undefined) {
        const parentSpan = this.spanToNode.get(span.parentSpanID!!)!!
        const childSpan = this.spanToNode.get(span.spanID)!!
        let link: ForceGraph.GraphLink = {
          id: span.spanID,
          source: parentSpan,
          target: childSpan,
          type: '',
        }

        links.push(link)
      }
    }

    return links
  }
}

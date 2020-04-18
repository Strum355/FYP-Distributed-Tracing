# Alternative Visualisation of Distributed Tracing data in a complex, large-scale distributed system

Final year project for University College Cork BSc in Computer Science. Exploring visualisations of distributed tracing data
and implementing OpenTracing tracer shims to collect runtime and compile time information with which to enrich spans to ultimately
be consumed by a debug adapter and debug extension for Visual Studio Code to step through code in a multi-repo polyglot distributed 
system, powered by a GraphQL API server.

TBC.

## How To Run

This project was developed and made for Unix systems. Windows filesystems are *not* supported.

### Requirements

- docker
- docker-compose
- Visual Studio Code
- NodeJS
- NPM

A number of ports are required to be unbound:

- 80
- 5001
- 8001
- 8002
- 8080
- 8082
- 14268
- 16686

Everything except the extension can be build through docker-compose. Run `docker-compose build` and wait for everything to be built.

You can then run everything with `docker-compose up -d`.

To generate some data, run `curl -H 'user_id: 12345' -H 'session_id: asdfasdf12345' localhost:8001/`.

Then, open `./trace_step/extension` in Visual Studio Code and hit F5 to start the extension in a new Visual Studio Code instance. Navigate this instance
to `./trace_step/microservices/exmpl1`, hit F5, navigate to `http://jaeger.localhost/` and use the search tools to find the trace(s) generated. Take
one of the trace IDs and insert it into the popup menu in the newly opened Visual Studo Code instance. Follow the popup menu instructions from there. : )
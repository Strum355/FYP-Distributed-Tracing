FROM gradle:6.3.0-jdk13 AS dev

WORKDIR /topology

USER root

COPY . .

RUN gradle compileKotlin

ENTRYPOINT [ "bash", "run.sh" ]

FROM gradle:6.3.0-jdk13 AS builder

WORKDIR /topology

COPY . .

RUN gradle --no-daemon fatJar

FROM openjdk:13-jre-alpine AS jar

COPY --from=builder /topology/build/fatjar/topology.jar .

ENTRYPOINT [ "java", "-jar", "-server", "topology.jar" ]
FROM maven:3.6-jdk-13

COPY microservices/exmpl4/ .

COPY jvm /jvm

RUN cd /jvm && mvn package
RUN cd /jvm && mvn install:install-file \
    -Dfile=target/tracestepshim-0.1-SNAPSHOT.jar \
    -DgroupId=xyz.noahsc.tracestep \
    -DartifactId=tracestepshim \
    -Dpackaging=jar \
    -Dversion=0.1-SNAPSHOT \
    -DgeneratePom=true

RUN mvn package

ENTRYPOINT [ "java", "-jar", "target/tracestep-1.0-shaded.jar", "server" ]
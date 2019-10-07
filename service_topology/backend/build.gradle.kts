import org.gradle.jvm.tasks.Jar
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.jetbrains.kotlin.jvm") version "1.3.41"
    id("com.hpe.kraal") version "0.0.15"
    application
}

repositories {
    mavenCentral()
    jcenter()
    maven(url="http://dl.bintray.com/mbuhot/maven")
}

group = "xyz.noahsc.topology"

dependencies {
    implementation(platform("org.jetbrains.kotlin:kotlin-bom"))
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    implementation("io.ktor:ktor-server-cio:1.2.4")
    implementation("io.ktor:ktor-gson:1.2.4")
    compile("mbuhot:eskotlin:0.7.0")
    compile("org.elasticsearch.client:elasticsearch-rest-high-level-client:7.3.2")
    compile("ch.qos.logback:logback-classic:1.2.3")
    compile("org.apache.logging.log4j:log4j-core:2.12.1")
    compile("com.apurebase:kgraphql:0.7.0")
}

tasks.withType<KotlinCompile>().configureEach {
    kotlinOptions {
        jvmTarget = "1.8"
        // need use-experimental for Ktor CIO
        freeCompilerArgs += listOf("-Xuse-experimental=kotlin.Experimental", "-progressive")
        // disable -Werror with: ./gradlew -PwarningsAsErrors=false
        //allWarningsAsErrors = project.findProperty("warningsAsErrors") != "false"
    }
}


val fatjar by tasks.creating(Jar::class) {
    from(kraal.outputZipTrees) {}

    manifest {        
        attributes("Main-Class" to "xyz.noahsc.topology.AppKt")
    }

    destinationDirectory.set(project.buildDir.resolve("fatjar"))
    archiveFileName.set("topology.jar")
}

application {
    mainClassName = "xyz.noahsc.topology.AppKt"
}
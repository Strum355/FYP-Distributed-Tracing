package tracestep;

import java.util.concurrent.TimeUnit;

import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.BenchmarkMode;
import org.openjdk.jmh.annotations.Fork;
import org.openjdk.jmh.annotations.Mode;
import org.openjdk.jmh.annotations.OutputTimeUnit;
import org.openjdk.jmh.annotations.Param;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.State;
import org.openjdk.jmh.annotations.Warmup;
import org.openjdk.jmh.runner.Runner;
import org.openjdk.jmh.runner.RunnerException;
import org.openjdk.jmh.runner.options.Options;
import org.openjdk.jmh.runner.options.OptionsBuilder;

import io.opentracing.mock.MockTracer;
import xyz.noahsc.tracestepshim.TracerShim;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Benchmark)
@Warmup(iterations = 20)
@Fork(value=1)
public class TracerBenchmark {

    @Param({"10000000"})
    private int N;

    public static void main(String[] args) throws RunnerException {
        Options opt = new OptionsBuilder()
                .include(TracerBenchmark.class.getSimpleName())
                .forks(1)
                .build();

        new Runner(opt).run();
    }

    @Benchmark
    public void testMock() {
        MockTracer tracer = new MockTracer();
        tracer.buildSpan("test").start().finish();;
        tracer.close();
    }

    @Benchmark
    public void testShim() {
        MockTracer tracer = new MockTracer();
        TracerShim shim = new TracerShim(tracer, 1);
        shim.buildSpan("test").start().finish();;
        shim.close();
    }

}
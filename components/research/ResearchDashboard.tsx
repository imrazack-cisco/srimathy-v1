import MetricCard from "./MetricCard";
import { runtimeMetrics } from "@/research/metrics";

export default function ResearchDashboard() {

    return (

        <div className="space-y-6">

            <h1 className="text-3xl font-bold text-white">

                Research Dashboard

            </h1>

            <div className="grid grid-cols-4 gap-4">

                <MetricCard
                    title="TTFT"
                    value={`${runtimeMetrics.ttft} ms`}
                />

                <MetricCard
                    title="Tokens / sec"
                    value={runtimeMetrics.tokensPerSecond}
                />

                <MetricCard
                    title="Peak RAM"
                    value={`${runtimeMetrics.peakRamMb} MB`}
                />

                <MetricCard
                    title="Retrieved Chunks"
                    value={runtimeMetrics.retrievedChunks}
                />

                <MetricCard
                    title="Similarity"
                    value={runtimeMetrics.similarity}
                />

                <MetricCard
                    title="Confidence"
                    value={`${runtimeMetrics.confidence}%`}
                />

                <MetricCard
                    title="Curriculum"
                    value={`${runtimeMetrics.curriculumAlignment}%`}
                />

                <MetricCard
                    title="Hallucination"
                    value={runtimeMetrics.hallucinationRisk}
                />

            </div>

        </div>

    );

}
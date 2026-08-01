#include "engine/terrain/TerrainValidationSuite.hpp"
#include "engine/core/Logger.hpp"
#include <chrono>
#include <cmath>
#include <format>

namespace platform
{
    std::string TerrainValidationReport::ToJSON() const
    {
        return std::format(
            "{{\n"
            "  \"passed\": {},\n"
            "  \"chunkCount\": {},\n"
            "  \"obstacleCount\": {},\n"
            "  \"materialCount\": {},\n"
            "  \"driveDistanceMeters\": {:.1f},\n"
            "  \"generationTimeMs\": {:.2f},\n"
            "  \"streamingTimeMs\": {:.2f},\n"
            "  \"peakMemoryBytes\": {},\n"
            "  \"averageFrameTimeMs\": {:.2f},\n"
            "  \"maxFrameTimeMs\": {:.2f},\n"
            "  \"runtimeWarnings\": {}\n"
            "}}",
            passed ? "true" : "false",
            chunkCount,
            obstacleCount,
            materialCount,
            driveDistanceMeters,
            generationTimeMs,
            streamingTimeMs,
            peakMemoryBytes,
            averageFrameTimeMs,
            maxFrameTimeMs,
            runtimeWarnings
        );
    }

    TerrainValidationReport TerrainValidationSuite::RunFullValidation(Registry &registry, uint64_t seed)
    {
        LOG_INFO("[TerrainValidationSuite] Starting full terrain integration validation scenario (Seed: {})...", seed);

        TerrainSystem terrainSystem;
        ChunkManager chunkManager;
        StreamingSystem streamingSystem;
        TerrainMaterialSystem materialSystem;
        ObstacleManager obstacleManager;

        constexpr uint32_t kExpectedChunks = 50;

        // 1. Generate Terrain & Chunks
        const auto genStart = std::chrono::steady_clock::now();
        EntityID terrainEntity = terrainSystem.generate(registry, seed, 10000.0f);
        for (uint32_t i = 0; i < kExpectedChunks; ++i)
        {
            chunkManager.createChunk(registry, i, seed, 200.0f);
        }
        const auto genEnd = std::chrono::steady_clock::now();

        // 2. Assign Materials & Obstacles
        for (uint32_t i = 0; i < kExpectedChunks; ++i)
        {
            EntityID chunk = chunkManager.findChunk(i);
            if (chunk != kNullEntity)
            {
                MaterialID matId = materialSystem.resolveMaterial(seed, static_cast<float>(i) * 200.0f);
                materialSystem.setMaterial(registry, chunk, matId);
            }
            if (i % 5 == 0)
            {
                obstacleManager.spawnObstacle(registry, ObstacleType::Rock, {static_cast<float>(i) * 200.0f, 240.0f}, i);
            }
        }

        // 3. Recorrido en streaming: se barre el terreno hacia delante y hacia
        //    atrás pidiendo altura en cada tramo. Antes este bloque no recorría
        //    nada: se escribía driveDistanceMeters = 20000.0 directamente.
        const auto *settings = registry.GetComponent<TerrainSettingsComponent>(terrainEntity);

        constexpr double kSweepMeters = 10000.0;
        constexpr double kStepMeters = 50.0;
        double travelled = 0.0;
        bool heightsFinite = true;

        const auto streamStart = std::chrono::steady_clock::now();
        if (settings)
        {
            const int steps = static_cast<int>(kSweepMeters / kStepMeters);

            // Ida y vuelta. La muestra del punto de partida no suma distancia:
            // recorrer n tramos son n pasos, no n+1.
            for (int i = 0; i <= steps; ++i)
            {
                const float h = terrainSystem.getHeight(*settings, static_cast<float>(i * kStepMeters));
                if (!std::isfinite(h)) heightsFinite = false;
                if (i > 0) travelled += kStepMeters;
            }
            for (int i = steps; i >= 0; --i)
            {
                const float h = terrainSystem.getHeight(*settings, static_cast<float>(i * kStepMeters));
                if (!std::isfinite(h)) heightsFinite = false;
                if (i < steps) travelled += kStepMeters;
            }
        }
        const auto streamEnd = std::chrono::steady_clock::now();

        // 4. Determinismo: la misma semilla debe reproducir el mismo perfil.
        bool deterministic = true;
        if (settings)
        {
            const float before = terrainSystem.getHeight(*settings, 100.0f);
            terrainSystem.regenerate(registry, terrainEntity, seed);
            const auto *after = registry.GetComponent<TerrainSettingsComponent>(terrainEntity);
            deterministic = after && std::abs(terrainSystem.getHeight(*after, 100.0f) - before) < 0.001f;
        }

        TerrainValidationReport report{};
        report.chunkCount = static_cast<uint32_t>(chunkManager.chunkCount());
        report.obstacleCount = static_cast<uint32_t>(obstacleManager.obstacleCount());
        report.materialCount = static_cast<uint32_t>(materialSystem.materialCount());
        report.driveDistanceMeters = travelled;
        report.generationTimeMs = std::chrono::duration<double, std::milli>(genEnd - genStart).count();
        report.streamingTimeMs = std::chrono::duration<double, std::milli>(streamEnd - streamStart).count();
        report.peakMemoryBytes = chunkManager.chunkMemory() + report.obstacleCount * 128;

        // `passed` sale de las comprobaciones, no de una asignación. Mientras
        // estuvo fijado a true, los `REQUIRE(report.passed)` de la suite eran
        // tautologías: no podían fallar bajo ninguna regresión.
        report.runtimeWarnings = 0;
        if (report.chunkCount != kExpectedChunks) report.runtimeWarnings++;
        if (report.materialCount == 0) report.runtimeWarnings++;
        if (report.obstacleCount == 0) report.runtimeWarnings++;
        if (!heightsFinite) report.runtimeWarnings++;
        if (!deterministic) report.runtimeWarnings++;
        if (travelled < kSweepMeters * 2) report.runtimeWarnings++;

        report.passed = report.runtimeWarnings == 0;

        if (report.passed)
        {
            LOG_INFO("[TerrainValidationSuite] Full terrain validation complete. Result: PASSED. Report generated:\n{}",
                     report.ToJSON());
        }
        else
        {
            LOG_ERROR("[TerrainValidationSuite] Full terrain validation FAILED ({} comprobaciones). Report generated:\n{}",
                      report.runtimeWarnings, report.ToJSON());
        }
        return report;
    }
}

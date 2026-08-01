#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>

#include "engine/filesystem/VirtualPath.hpp"
#include "engine/filesystem/providers/NativeFileProvider.hpp"
#include "engine/filesystem/providers/MemoryFileProvider.hpp"
#include "engine/filesystem/MountPoint.hpp"
#include "engine/filesystem/VirtualFileSystem.hpp"
#include "engine/filesystem/FileWatchService.hpp"
#include "engine/pipeline/processors/ProcessorRegistry.hpp"
#include "engine/pipeline/PackageManifest.hpp"
#include "engine/pipeline/ContentCache.hpp"
#include "engine/pipeline/ContentPipeline.hpp"
#include "engine/pipeline/debug/ContentDiagnostics.hpp"
#include "engine/pipeline/debug/ContentDebugOverlay.hpp"
#include "examples/hill_climb/ContentValidationScene.hpp"

TEST_CASE("VirtualPath Parsing and Normalization", "[VFS]")
{
    platform::VirtualPath vpath("assets://textures/ui/button.png");

    REQUIRE(vpath.IsValid());
    REQUIRE(vpath.GetScheme() == "assets");
    REQUIRE(vpath.GetRelativePath() == "textures/ui/button.png");
    REQUIRE(vpath.GetExtension() == ".png");
    REQUIRE(vpath.GetFilename() == "button.png");
    REQUIRE(vpath.GetParent().GetFullPath() == "assets://textures/ui");

    // Normalization with backslashes
    platform::VirtualPath vpath2("game://config\\settings.json");
    REQUIRE(vpath2.GetScheme() == "game");
    REQUIRE(vpath2.GetRelativePath() == "config/settings.json");
}

TEST_CASE("MemoryFileProvider CRUD Operations", "[VFS]")
{
    platform::MemoryFileProvider provider;

    std::string path = "virtual/test.txt";
    std::vector<uint8_t> data = {'H', 'e', 'l', 'l', 'o'};

    REQUIRE(provider.WriteBytes(path, data));
    REQUIRE(provider.Exists(path));

    std::vector<uint8_t> readBack;
    REQUIRE(provider.ReadBytes(path, readBack));
    REQUIRE(readBack == data);

    std::vector<std::string> enumList = provider.Enumerate("virtual");
    REQUIRE(enumList.size() == 1);
    REQUIRE(enumList[0] == path);

    REQUIRE(provider.Delete(path));
    REQUIRE(!provider.Exists(path));
}

TEST_CASE("VirtualFileSystem Mount Resolution and Resolution API", "[VFS]")
{
    platform::VirtualFileSystem vfs;
    REQUIRE(vfs.Initialize());

    platform::MemoryFileProvider memProvider;
    vfs.Mount("custom", "RAM/custom/", &memProvider, 10);

    platform::VirtualPath customPath("custom://data/levels.json");
    REQUIRE(vfs.ResolvePhysicalPath(customPath) == "RAM/custom/data/levels.json");

    vfs.Shutdown();
}

TEST_CASE("ProcessorRegistry Routing and Processor Execution", "[Pipeline]")
{
    platform::ProcessorRegistry registry;

    REQUIRE(registry.HasProcessor(platform::AssetType::Texture));
    REQUIRE(registry.HasProcessor(platform::AssetType::Audio));
    REQUIRE(registry.HasProcessor(platform::AssetType::Font));
    REQUIRE(registry.HasProcessor(platform::AssetType::Config));

    platform::IResourceProcessor *texProc = registry.GetProcessor(platform::AssetType::Texture);
    REQUIRE(texProc != nullptr);

    std::vector<uint8_t> source = {0x00, 0x01};
    std::vector<uint8_t> compiled;
    platform::AssetMetadata meta;

    REQUIRE(texProc->Process(source, compiled, meta));
    REQUIRE(compiled.size() > 0);
    REQUIRE(meta.Type == platform::AssetType::Texture);
}

TEST_CASE("PackageManifest Serialization and Lookup", "[Pipeline]")
{
    platform::PackageManifest manifest;

    platform::PackageManifestEntry entry;
    entry.ID = 555;
    entry.VirtualPathStr = "assets://textures/hero.png";
    entry.CompiledPathStr = "cache://hero.tex";
    entry.Type = platform::AssetType::Texture;
    entry.Hash = "sha256-hero-hash";
    entry.SizeBytes = 2048;

    manifest.AddEntry(entry);
    REQUIRE(manifest.GetTotalEntries() == 1);

    const platform::PackageManifestEntry *found = manifest.FindEntry(555);
    REQUIRE(found != nullptr);
    REQUIRE(found->VirtualPathStr == "assets://textures/hero.png");
}

TEST_CASE("ContentCache Hit Invalidation and Hit Rate", "[Pipeline]")
{
    platform::ContentCache cache;
    platform::AssetID id = 12345;
    std::vector<uint8_t> compiled = {0x01, 0x02, 0x03};

    cache.Store(id, platform::ContentCacheTier::CompiledCache, compiled);

    std::vector<uint8_t> out;
    REQUIRE(cache.Get(id, platform::ContentCacheTier::CompiledCache, out));
    REQUIRE(out == compiled);
    REQUIRE(cache.GetStats().Hits == 1);

    cache.Invalidate(id);
    REQUIRE(!cache.Get(id, platform::ContentCacheTier::CompiledCache, out));
    REQUIRE(cache.GetStats().Misses == 1);
}

TEST_CASE("FileWatchService Event Dispatching", "[VFS]")
{
    platform::VirtualFileSystem vfs;
    vfs.Initialize();

    platform::FileWatchService watchService;
    watchService.Initialize(&vfs);

    bool eventTriggered = false;
    watchService.SetCallback([&eventTriggered](platform::FileWatchEventType type, const platform::VirtualPath &vpath) {
        (void)type;
        (void)vpath;
        eventTriggered = true;
    });

    watchService.TriggerEvent(platform::FileWatchEventType::Modified, platform::VirtualPath("assets://config/vehicle.json"));
    REQUIRE(watchService.GetTotalEventsTriggered() == 1);

    watchService.Poll();
    REQUIRE(eventTriggered);
}

TEST_CASE("ContentValidationScene Full Lifecycle", "[ContentScene]")
{
    platform::ContentValidationScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    REQUIRE(scene.IsActive());
    REQUIRE(scene.GetVFS().IsInitialized());
    REQUIRE(scene.GetContentPipeline().IsInitialized());

    scene.Update(0.016);

    scene.Deactivate();
    scene.Shutdown();
}

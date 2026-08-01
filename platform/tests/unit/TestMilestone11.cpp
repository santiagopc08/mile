#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>

#include "engine/assets/AssetID.hpp"
#include "engine/assets/AssetTypes.hpp"
#include "engine/assets/AssetMetadata.hpp"
#include "engine/assets/Asset.hpp"
#include "engine/assets/handles/AssetHandle.hpp"
#include "engine/assets/handles/WeakAssetHandle.hpp"
#include "engine/assets/handles/AssetReference.hpp"
#include "engine/assets/registry/AssetRegistry.hpp"
#include "engine/assets/database/AssetDatabase.hpp"
#include "engine/assets/importers/ImporterFactory.hpp"
#include "engine/assets/cache/AssetCache.hpp"
#include "engine/assets/graph/DependencyGraph.hpp"
#include "engine/assets/hotreload/HotReloadManager.hpp"
#include "engine/assets/AssetManager.hpp"
#include "examples/hill_climb/AssetValidationScene.hpp"

TEST_CASE("AssetID Hashing and Stability", "[Assets]")
{
    std::string uuid1 = "uuid-chassis.png";
    std::string uuid2 = "uuid-wheel.png";

    platform::AssetID id1 = platform::HashAssetUUID(uuid1);
    platform::AssetID id2 = platform::HashAssetUUID(uuid2);

    REQUIRE(id1 != platform::kInvalidAssetID);
    REQUIRE(id2 != platform::kInvalidAssetID);
    REQUIRE(id1 != id2);

    // Hash stays identical across calls
    REQUIRE(platform::HashAssetUUID(uuid1) == id1);
}

TEST_CASE("AssetHandle Lifecycle and State Queries", "[Assets]")
{
    auto asset = std::make_shared<platform::Asset>();
    platform::AssetHandle<platform::Asset> handle(101, asset);

    REQUIRE(handle.IsValid());
    REQUIRE(handle.IsReady());
    REQUIRE(handle.GetID() == 101);
    REQUIRE(handle.Get() == asset.get());

    platform::WeakAssetHandle<platform::Asset> weakHandle(handle);
    REQUIRE(!weakHandle.IsExpired());

    auto locked = weakHandle.Lock();
    REQUIRE(locked.IsReady());
    REQUIRE(locked.GetID() == 101);
}

TEST_CASE("AssetRegistry Lookups", "[Assets]")
{
    platform::AssetRegistry registry;

    platform::AssetMetadata meta;
    meta.Name = "textures/buggy.png";
    meta.UUID = "uuid-buggy.png";
    meta.ID = platform::HashAssetUUID(meta.UUID);
    meta.Type = platform::AssetType::Texture;

    REQUIRE(registry.RegisterAsset(meta));
    REQUIRE(registry.Contains(meta.ID));

    const platform::AssetMetadata *foundByID = registry.FindByID(meta.ID);
    REQUIRE(foundByID != nullptr);
    REQUIRE(foundByID->Name == "textures/buggy.png");

    const platform::AssetMetadata *foundByName = registry.FindByName("textures/buggy.png");
    REQUIRE(foundByName != nullptr);
    REQUIRE(foundByName->ID == meta.ID);

    auto texList = registry.FindByType(platform::AssetType::Texture);
    REQUIRE(texList.size() == 1);
}

TEST_CASE("AssetDatabase CRUD Operations", "[Assets]")
{
    platform::AssetDatabase database;
    REQUIRE(database.Initialize("test_database.manifest"));

    REQUIRE(database.CreateAsset("audio/engine.wav", platform::AssetType::Audio, "EngineAudio"));
    REQUIRE(database.GetRegistry().GetAssetCount() == 1);

    const platform::AssetMetadata *meta = database.GetRegistry().FindByName("EngineAudio");
    REQUIRE(meta != nullptr);
    REQUIRE(meta->Type == platform::AssetType::Audio);

    REQUIRE(database.UpdateAsset(meta->ID, "audio/engine_v2.wav"));
    const platform::AssetMetadata *updatedMeta = database.GetRegistry().FindByID(meta->ID);
    REQUIRE(updatedMeta->SourcePath == "audio/engine_v2.wav");

    REQUIRE(database.DeleteAsset(meta->ID));
    REQUIRE(database.GetRegistry().GetAssetCount() == 0);
}

TEST_CASE("ImporterFactory File Extension Routing", "[Assets]")
{
    platform::ImporterFactory factory;

    REQUIRE(factory.HasImporter(".png"));
    REQUIRE(factory.HasImporter(".wav"));
    REQUIRE(factory.HasImporter(".ttf"));
    REQUIRE(factory.HasImporter(".json"));

    platform::IAssetImporter *texImporter = factory.GetImporterForExtension(".png");
    REQUIRE(texImporter != nullptr);
    REQUIRE(texImporter->GetSupportedAssetType() == platform::AssetType::Texture);
}

TEST_CASE("AssetCache Hit/Miss Metrics and Eviction", "[Assets]")
{
    platform::AssetCache cache;

    platform::AssetMetadata meta;
    meta.UUID = "uuid-font.ttf";
    meta.ID = platform::HashAssetUUID(meta.UUID);

    auto fontAsset = std::make_shared<platform::Asset>(meta);
    cache.Store(meta.ID, fontAsset, platform::CachePolicy::Shared);

    REQUIRE(cache.Contains(meta.ID));
    auto retrieved = cache.Get(meta.ID);
    REQUIRE(retrieved != nullptr);
    REQUIRE(cache.GetStats().Hits == 1);

    auto missing = cache.Get(99999);
    REQUIRE(missing == nullptr);
    REQUIRE(cache.GetStats().Misses == 1);
    REQUIRE(cache.GetStats().GetHitRatio() == Catch::Approx(0.5f));
}

TEST_CASE("DependencyGraph Node Traversal & Circular Detection", "[Assets]")
{
    platform::DependencyGraph graph;

    platform::AssetID vehicleAsset = 1;
    platform::AssetID chassisTex = 2;
    platform::AssetID wheelTex = 3;

    graph.AddDependency(vehicleAsset, chassisTex);
    graph.AddDependency(vehicleAsset, wheelTex);

    auto children = graph.GetChildren(vehicleAsset);
    REQUIRE(children.size() == 2);

    auto parents = graph.GetParents(chassisTex);
    REQUIRE(parents.size() == 1);
    REQUIRE(parents[0] == vehicleAsset);

    REQUIRE(!graph.DetectCircularDependencies());

    // Introduce cycle: wheelTex -> vehicleAsset
    graph.AddDependency(wheelTex, vehicleAsset);
    REQUIRE(graph.DetectCircularDependencies()); // Cycle detected!
}

TEST_CASE("AssetValidationScene Lifecycle", "[AssetScene]")
{
    platform::AssetValidationScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    REQUIRE(scene.IsActive());
    REQUIRE(scene.GetAssetManager().IsInitialized());

    scene.Update(0.016);

    scene.Deactivate();
    scene.Shutdown();
}

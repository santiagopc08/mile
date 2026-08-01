#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "engine/scene/Entity.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/scene/View.hpp"
#include "engine/scene/Scene.hpp"
#include "engine/scene/SceneManager.hpp"
#include "engine/scene/systems/TransformSystem.hpp"

TEST_CASE("Entity Registry Creation and Stable 64-Bit IDs", "[Scene]")
{
    platform::Registry registry;
    platform::EntityID e1 = registry.CreateEntity("Player");
    platform::EntityID e2 = registry.CreateEntity("Enemy");

    REQUIRE(e1 != platform::kNullEntity);
    REQUIRE(e2 != platform::kNullEntity);
    REQUIRE(e1 != e2);
    REQUIRE(registry.IsAlive(e1));
    REQUIRE(registry.IsAlive(e2));
    REQUIRE(registry.EntityCount() == 2);

    auto *nameComp = registry.GetComponent<platform::NameComponent>(e1);
    REQUIRE(nameComp != nullptr);
    REQUIRE(nameComp->Name == "Player");
}

TEST_CASE("Entity Deferred Destruction", "[Scene]")
{
    platform::Registry registry;
    platform::EntityID e1 = registry.CreateEntity("Temporary");
    REQUIRE(registry.EntityCount() == 1);

    registry.DestroyEntity(e1);
    // Pending destruction: still reports alive until flush
    REQUIRE(registry.IsAlive(e1));

    registry.FlushDestroyedEntities();
    REQUIRE_FALSE(registry.IsAlive(e1));
    REQUIRE(registry.EntityCount() == 0);
}

TEST_CASE("Component Attachment and Storage", "[Scene]")
{
    platform::Registry registry;
    platform::EntityID entity = registry.CreateEntity("TestEntity");

    auto &transform = registry.AddComponent<platform::TransformComponent>(entity);
    transform.SetPosition({10.0f, 20.0f});
    transform.SetScale({2.0f, 2.0f});

    REQUIRE(registry.HasComponent<platform::TransformComponent>(entity));
    auto *fetchedTransform = registry.GetComponent<platform::TransformComponent>(entity);
    REQUIRE(fetchedTransform != nullptr);
    REQUIRE(fetchedTransform->Position.x == 10.0f);
    REQUIRE(fetchedTransform->Position.y == 20.0f);
    REQUIRE(fetchedTransform->Scale.x == 2.0f);
    REQUIRE(fetchedTransform->IsDirty);
}

TEST_CASE("Registry View Component Filtering and Traversal", "[Scene]")
{
    platform::Registry registry;
    platform::EntityID e1 = registry.CreateEntity("Entity1");
    platform::EntityID e2 = registry.CreateEntity("Entity2");

    registry.AddComponent<platform::TransformComponent>(e1);
    registry.AddComponent<platform::TransformComponent>(e2);

    // Give e1 custom active state
    auto *active1 = registry.GetComponent<platform::ActiveComponent>(e1);
    REQUIRE(active1 != nullptr);
    active1->Enabled = true;

    auto view = registry.GetView<platform::TransformComponent, platform::ActiveComponent>();
    REQUIRE(view.Size() == 2);

    size_t count = 0;
    view.Each([&](platform::EntityID id, platform::TransformComponent &t, platform::ActiveComponent &a) {
        (void)t;
        (void)a;
        REQUIRE(registry.IsAlive(id));
        count++;
    });

    REQUIRE(count == 2);
}

TEST_CASE("TransformSystem Dirty Flag Processing", "[Scene]")
{
    platform::Registry registry;
    platform::EntityID entity = registry.CreateEntity("TransformEntity");
    auto &transform = registry.AddComponent<platform::TransformComponent>(entity);

    transform.SetPosition({100.0f, 200.0f});
    REQUIRE(transform.IsDirty);

    platform::TransformSystem system;
    system.Update(registry, 0.016);
    REQUIRE(system.GetUpdatedTransformCount() == 1);

    system.PrepareRenderTransforms(registry);
    REQUIRE_FALSE(transform.IsDirty);
}

TEST_CASE("Scene Lifecycle and SceneManager Switching", "[Scene]")
{
    platform::SceneManager manager;

    auto s1 = std::make_unique<platform::Scene>("Level 1");
    auto s2 = std::make_unique<platform::Scene>("Level 2");

    REQUIRE(manager.LoadScene(std::move(s1)));
    REQUIRE(manager.HasActiveScene());
    REQUIRE(manager.GetActiveScene()->GetMetadata().Name == "Level 1");

    REQUIRE(manager.SwitchScene(std::move(s2)));
    REQUIRE(manager.HasActiveScene());
    REQUIRE(manager.GetActiveScene()->GetMetadata().Name == "Level 2");

    manager.UnloadScene();
    REQUIRE_FALSE(manager.HasActiveScene());
}

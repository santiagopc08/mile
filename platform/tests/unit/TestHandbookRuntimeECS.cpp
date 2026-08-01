#include <catch2/catch_test_macros.hpp>

#include "engine/app/Engine.hpp"
#include "engine/scene/Scene.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/graphics/RenderCommandQueue.hpp"
#include "engine/graphics/RenderCommand.hpp"
#include "engine/assets/handles/AssetHandle.hpp"

TEST_CASE("HANDBOOK-006 Runtime Pause State Management", "[Runtime]")
{
    platform::Engine engine;
    REQUIRE(!engine.IsPaused());

    engine.Pause();
    REQUIRE(engine.IsPaused());

    engine.Resume();
    REQUIRE(!engine.IsPaused());
}

TEST_CASE("HANDBOOK-007 ECS View Contiguous Storage and Zero Allocations", "[ECS]")
{
    platform::Scene scene("ECS Scene");
    auto e1 = scene.GetRegistry().CreateEntity("E1");
    auto e2 = scene.GetRegistry().CreateEntity("E2");

    scene.GetRegistry().AddComponent<platform::TransformComponent>(e1);
    scene.GetRegistry().AddComponent<platform::TransformComponent>(e2);

    size_t count = 0;
    auto view = scene.GetRegistry().GetView<platform::TransformComponent>();
    view.Each([&count](platform::EntityID id, platform::TransformComponent &transform) {
        (void)id;
        (void)transform;
        count++;
    });

    REQUIRE(count == 2);
}

TEST_CASE("HANDBOOK-008 Sorted Render Queue Enqueue and Flush", "[Rendering]")
{
    platform::RenderCommandQueue queue;
    REQUIRE(queue.GetCommandCount() == 0);

    queue.Enqueue(std::make_unique<platform::ClearCommand>(0.1f, 0.1f, 0.1f));
    queue.Enqueue(std::make_unique<platform::DrawRectangleCommand>(glm::vec2{10, 10}, glm::vec2{50, 50}, 0.0f, glm::vec4{1, 1, 1, 1}));

    REQUIRE(queue.GetCommandCount() == 2);

    queue.ClearQueue();
    REQUIRE(queue.GetCommandCount() == 0);
}

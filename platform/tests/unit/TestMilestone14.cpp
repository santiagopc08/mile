#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/scene/components/RelationshipComponent.hpp"
#include "engine/scene/components/PrefabComponent.hpp"
#include "engine/scene/prefab/PrefabManager.hpp"
#include "editor/gizmos/GizmoSystem.hpp"
#include "editor/app/EditorContext.hpp"
#include "editor/panels/HierarchyPanel.hpp"
#include "editor/panels/InspectorPanel.hpp"

TEST_CASE("Entity Relationship Component Parenting", "[SceneAuthoring]")
{
    platform::Scene scene("Hierarchy Scene");
    auto parent = scene.GetRegistry().CreateEntity("ParentNode");
    auto child = scene.GetRegistry().CreateEntity("ChildNode");

    auto &rel = scene.GetRegistry().AddComponent<platform::RelationshipComponent>(child);
    rel.Parent = parent;

    REQUIRE(rel.HasParent());
    REQUIRE(rel.Parent == parent);
}

TEST_CASE("Prefab System Creation Instantiation and Overrides", "[Prefabs]")
{
    platform::Scene scene("Prefab Scene");
    platform::PrefabManager prefabManager;

    auto sourceEntity = scene.GetRegistry().CreateEntity("PlayerVehicle");
    auto &transform = scene.GetRegistry().AddComponent<platform::TransformComponent>(sourceEntity);
    transform.Position = {10.0f, 20.0f};

    platform::PrefabData prefab = prefabManager.CreatePrefab(scene.GetRegistry(), sourceEntity, "PlayerVehiclePrefab");
    REQUIRE(prefab.ID != platform::kInvalidAssetID);
    REQUIRE(prefab.Name == "PlayerVehiclePrefab");

    auto instanceEntity = prefabManager.InstantiatePrefab(scene.GetRegistry(), prefab);
    REQUIRE(instanceEntity != platform::kNullEntity);

    auto *instTransform = scene.GetRegistry().GetComponent<platform::TransformComponent>(instanceEntity);
    REQUIRE(instTransform != nullptr);
    REQUIRE(instTransform->Position.x == Catch::Approx(10.0f));
    REQUIRE(instTransform->Position.y == Catch::Approx(20.0f));

    // Modify instance (override)
    instTransform->Position = {50.0f, 50.0f};
    auto *prefabComp = scene.GetRegistry().GetComponent<platform::PrefabComponent>(instanceEntity);
    REQUIRE(prefabComp != nullptr);
    prefabComp->IsOverridden = true;

    // Revert overrides
    REQUIRE(prefabManager.RevertOverrides(scene.GetRegistry(), instanceEntity));
    REQUIRE(instTransform->Position.x == Catch::Approx(10.0f));
    REQUIRE(!prefabComp->IsOverridden);
}

TEST_CASE("Editor 2D Gizmos Mode & Selection Rendering", "[Gizmos]")
{
    platform::EditorContext context;
    platform::Scene scene("Gizmo Scene");
    context.ActiveScene = &scene;

    auto entity = scene.GetRegistry().CreateEntity("TargetEntity");
    scene.GetRegistry().AddComponent<platform::TransformComponent>(entity);
    context.Selection.SetEntitySelection(entity, "TargetEntity");

    platform::GizmoSystem gizmoSystem;
    gizmoSystem.SetMode(platform::GizmoMode::Translate);
    REQUIRE(gizmoSystem.GetMode() == platform::GizmoMode::Translate);

    gizmoSystem.RenderGizmos(context);

    gizmoSystem.SetMode(platform::GizmoMode::Rotate);
    REQUIRE(gizmoSystem.GetMode() == platform::GizmoMode::Rotate);
}

#include <catch2/catch_test_macros.hpp>

#include "examples/hill_climb/PlatformerScene.hpp"
#include "engine/character/CharacterComponent.hpp"
#include "engine/character/jump/JumpSettingsComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"

/*
 * La escena del platformer.
 *
 * Antes de existir, CharacterSystem, CharacterMovementSystem y JumpSystem sólo
 * se instanciaban dentro de los tests: había piezas y ningún montaje. Estos
 * casos fijan que la escena las una de verdad y que el jugador salga con todo
 * lo necesario para saltar, que es la condición previa a poder juzgar el feel.
 */

TEST_CASE("PlatformerScene monta un jugador jugable", "[platformer][scene]")
{
    platform::PlatformerScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    REQUIRE(scene.IsActive());

    const platform::EntityID player = scene.GetPlayerEntity();
    REQUIRE(player != platform::kNullEntity);

    auto &registry = scene.GetRegistry();

    SECTION("es un personaje, no una figura suelta")
    {
        REQUIRE(registry.GetComponent<platform::CharacterComponent>(player) != nullptr);
    }

    SECTION("tiene cuerpo físico para que la gravedad lo afecte")
    {
        auto *rb = registry.GetComponent<platform::RigidBodyComponent>(player);
        REQUIRE(rb != nullptr);
        REQUIRE(rb->Type == platform::BodyType::Dynamic);
    }

    SECTION("se puede ver")
    {
        REQUIRE(registry.GetComponent<platform::ShapeComponent>(player) != nullptr);
        REQUIRE(registry.GetComponent<platform::VisibilityComponent>(player) != nullptr);
    }

    SECTION("trae los ajustes de salto con gravedad asimétrica")
    {
        auto *jump = registry.GetComponent<platform::JumpSettingsComponent>(player);
        REQUIRE(jump != nullptr);
        REQUIRE(jump->variableJumpHeight);
        REQUIRE(jump->gravityScaleDown > jump->gravityScaleUp);
    }
}

TEST_CASE("PlatformerScene sobrevive a actualizarse sin entrada", "[platformer][scene]")
{
    platform::PlatformerScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    // Sin BindInput la escena debe quedarse quieta, no reventar: es el estado
    // en el que corre bajo test y en cualquier arranque headless.
    for (int i = 0; i < 10; ++i)
    {
        scene.Update(0.016);
    }

    REQUIRE(scene.GetPlayerEntity() != platform::kNullEntity);
}

TEST_CASE("El salto de la escena mueve al jugador", "[platformer][scene]")
{
    platform::PlatformerScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    auto &registry = scene.GetRegistry();
    const platform::EntityID player = scene.GetPlayerEntity();

    auto *rb = registry.GetComponent<platform::RigidBodyComponent>(player);
    REQUIRE(rb != nullptr);
    REQUIRE(rb->LinearVelocity.y == 0.0f);

    scene.GetJumpSystem().requestJump(registry, player);

    // Comportamiento, no contabilidad: el salto tiene que imprimir velocidad.
    REQUIRE(rb->LinearVelocity.y > 0.0f);
}

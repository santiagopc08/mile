#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/character/CharacterSystem.hpp"
#include "engine/character/jump/JumpSettingsComponent.hpp"
#include "engine/character/jump/JumpRuntimeComponent.hpp"
#include "engine/character/jump/JumpSystem.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"

/*
 * Comportamiento del salto, no contabilidad de estados.
 *
 * El resto de la suite del platformer verifica que las banderas y los estados
 * se actualicen (isJumping, JumpState::Jumping, contadores del profiler). Esas
 * comprobaciones pasarían igual aunque el salto dejara de producir movimiento:
 * de 795 aserciones, sólo 37 tocan posición o velocidad.
 *
 * Estos casos fijan el efecto observable: qué velocidad recibe el cuerpo, cómo
 * se recorta al soltar pronto y cómo cambia la escala de gravedad al subir y al
 * caer. Es lo que define la sensación del salto, y lo que se rompe en silencio
 * al tocar la física.
 */

namespace
{
    struct JumpFixture
    {
        platform::Scene scene{"Jump Behaviour Scene"};
        platform::CharacterSystem charSystem;
        platform::JumpSystem jumpSystem;
        platform::EntityID player{};

        JumpFixture()
        {
            player = charSystem.spawnCharacter(
                scene.GetRegistry(), 1, platform::CharacterType::Player, {0.0f, 0.0f});
        }

        platform::Registry &registry() { return scene.GetRegistry(); }

        platform::RigidBodyComponent &body()
        {
            auto *rb = registry().GetComponent<platform::RigidBodyComponent>(player);
            REQUIRE(rb != nullptr);
            return *rb;
        }

        platform::JumpSettingsComponent &settings()
        {
            auto *s = registry().GetComponent<platform::JumpSettingsComponent>(player);
            if (!s) s = &registry().AddComponent<platform::JumpSettingsComponent>(player);
            return *s;
        }
    };
}

TEST_CASE("El salto imprime velocidad vertical al cuerpo", "[jump][behaviour]")
{
    JumpFixture fx;
    fx.settings();

    REQUIRE(fx.body().LinearVelocity.y == 0.0f);

    fx.jumpSystem.requestJump(fx.registry(), fx.player);

    const float force = fx.settings().jumpForce;
    REQUIRE(force > 0.0f);
    // Sin esto el personaje "salta" en la máquina de estados pero no se mueve.
    REQUIRE(fx.body().LinearVelocity.y == force);
}

TEST_CASE("Soltar pronto recorta la altura del salto", "[jump][behaviour]")
{
    JumpFixture fx;
    fx.settings().variableJumpHeight = true;

    fx.jumpSystem.requestJump(fx.registry(), fx.player);
    const float ascendente = fx.body().LinearVelocity.y;
    REQUIRE(ascendente > 0.0f);

    fx.jumpSystem.cancelJump(fx.registry(), fx.player);

    // Altura variable: soltar a mitad de subida frena, no cancela el salto.
    REQUIRE(fx.body().LinearVelocity.y < ascendente);
    REQUIRE(fx.body().LinearVelocity.y > 0.0f);
}

TEST_CASE("Con altura variable desactivada el salto no se recorta", "[jump][behaviour]")
{
    JumpFixture fx;
    fx.settings().variableJumpHeight = false;

    fx.jumpSystem.requestJump(fx.registry(), fx.player);
    const float ascendente = fx.body().LinearVelocity.y;

    fx.jumpSystem.cancelJump(fx.registry(), fx.player);

    REQUIRE(fx.body().LinearVelocity.y == ascendente);
}

TEST_CASE("Cancelar mientras cae no acelera la caída", "[jump][behaviour]")
{
    JumpFixture fx;
    fx.settings();

    fx.jumpSystem.requestJump(fx.registry(), fx.player);
    fx.body().LinearVelocity.y = -5.0f; // ya en descenso

    fx.jumpSystem.cancelJump(fx.registry(), fx.player);

    // El recorte sólo aplica a velocidad positiva: recortar en caída sería
    // frenarla, que es justo lo contrario de lo que espera el jugador.
    REQUIRE(fx.body().LinearVelocity.y == -5.0f);
}

TEST_CASE("La gravedad es asimétrica entre subida y caída", "[jump][behaviour]")
{
    JumpFixture fx;
    auto &cfg = fx.settings();
    // La caída más pesada que la subida es lo que evita el salto "flotante".
    REQUIRE(cfg.gravityScaleDown > cfg.gravityScaleUp);

    fx.jumpSystem.requestJump(fx.registry(), fx.player);

    fx.body().LinearVelocity.y = 5.0f; // subiendo
    fx.jumpSystem.Update(fx.registry(), 0.016);
    const float subiendo = fx.body().GravityScale;

    fx.body().LinearVelocity.y = -5.0f; // cayendo
    fx.jumpSystem.Update(fx.registry(), 0.016);
    const float cayendo = fx.body().GravityScale;

    REQUIRE(subiendo == cfg.gravityScaleUp);
    REQUIRE(cayendo == cfg.gravityScaleDown);
    REQUIRE(cayendo > subiendo);
}

#ifndef PLATFORM_EXAMPLES_HILL_CLIMB_PLATFORMER_SCENE_HPP
#define PLATFORM_EXAMPLES_HILL_CLIMB_PLATFORMER_SCENE_HPP

#include "engine/scene/Scene.hpp"
#include "engine/input/Input.hpp"
#include "engine/input/actions/ActionContext.hpp"
#include "engine/graphics/camera/CameraManager.hpp"
#include "engine/character/CharacterSystem.hpp"
#include "engine/character/movement/CharacterMovementSystem.hpp"
#include "engine/character/jump/JumpSystem.hpp"

namespace platform
{
    /**
     * Primera escena jugable del platformer.
     *
     * Hasta ahora `CharacterSystem`, `CharacterMovementSystem` y `JumpSystem`
     * sólo se instanciaban dentro de los tests: existían las piezas y no había
     * nada que las montara, así que el juego no se podía ver fallar. Esta escena
     * las conecta a la entrada real para poder juzgar la sensación del salto,
     * que es lo único que no se puede afirmar desde una aserción.
     *
     * A diferencia de las secuencias guionadas de `*ValidationController`, aquí
     * manda el jugador: mover con las flechas, saltar con Accept, y soltar
     * Accept antes del vértice para recortar la altura del salto.
     */
    class PlatformerScene : public Scene
    {
    public:
        PlatformerScene();
        ~PlatformerScene() override = default;

        void BindInput(Input *input) { m_input = input; }

        [[nodiscard]] EntityID GetPlayerEntity() const { return m_player; }
        [[nodiscard]] CameraManager &GetCameraManager() { return m_cameraManager; }
        [[nodiscard]] JumpSystem &GetJumpSystem() { return m_jumpSystem; }
        [[nodiscard]] CharacterMovementSystem &GetMovementSystem() { return m_moveSystem; }

    protected:
        void OnInitialize() override;
        void OnUpdate(double dt) override;

    private:
        EntityID m_player{kNullEntity};

        ActionContext m_actionContext;
        CameraManager m_cameraManager;
        Input *m_input{nullptr};

        CharacterSystem m_charSystem;
        CharacterMovementSystem m_moveSystem;
        JumpSystem m_jumpSystem;

        /** Accept seguía pulsado el frame anterior: distingue mantener de soltar. */
        bool m_jumpHeldLastFrame{false};
    };
}

#endif // PLATFORM_EXAMPLES_HILL_CLIMB_PLATFORMER_SCENE_HPP

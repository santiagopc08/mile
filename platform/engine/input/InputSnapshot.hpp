#ifndef PLATFORM_ENGINE_INPUT_INPUT_SNAPSHOT_HPP
#define PLATFORM_ENGINE_INPUT_INPUT_SNAPSHOT_HPP

#include "engine/input/KeyCodes.hpp"
#include "engine/input/InputState.hpp"
#include <unordered_map>

namespace platform
{
    class InputSnapshot
    {
    public:
        InputSnapshot(
            std::unordered_map<Key, ButtonState> keyStates,
            std::unordered_map<MouseButton, ButtonState> mouseButtonStates,
            float mouseX, float mouseY,
            float mouseDx, float mouseDy,
            float scrollX, float scrollY)
            : m_keyStates(std::move(keyStates)),
              m_mouseButtonStates(std::move(mouseButtonStates)),
              m_mouseX(mouseX), m_mouseY(mouseY),
              m_mouseDx(mouseDx), m_mouseDy(mouseDy),
              m_scrollX(scrollX), m_scrollY(scrollY) {}

        [[nodiscard]] ButtonState GetKeyState(Key key) const
        {
            auto it = m_keyStates.find(key);
            if (it != m_keyStates.end())
            {
                return it->second;
            }
            return ButtonState::Idle;
        }

        [[nodiscard]] bool IsKeyPressed(Key key) const { return GetKeyState(key) == ButtonState::Pressed; }
        [[nodiscard]] bool IsKeyHeld(Key key) const { return GetKeyState(key) == ButtonState::Held || GetKeyState(key) == ButtonState::Pressed; }
        [[nodiscard]] bool IsKeyReleased(Key key) const { return GetKeyState(key) == ButtonState::Released; }

        [[nodiscard]] ButtonState GetMouseButtonState(MouseButton button) const
        {
            auto it = m_mouseButtonStates.find(button);
            if (it != m_mouseButtonStates.end())
            {
                return it->second;
            }
            return ButtonState::Idle;
        }

        [[nodiscard]] bool IsMouseButtonPressed(MouseButton button) const { return GetMouseButtonState(button) == ButtonState::Pressed; }
        [[nodiscard]] bool IsMouseButtonHeld(MouseButton button) const { return GetMouseButtonState(button) == ButtonState::Held || GetMouseButtonState(button) == ButtonState::Pressed; }
        [[nodiscard]] bool IsMouseButtonReleased(MouseButton button) const { return GetMouseButtonState(button) == ButtonState::Released; }

        [[nodiscard]] float GetMouseX() const { return m_mouseX; }
        [[nodiscard]] float GetMouseY() const { return m_mouseY; }
        [[nodiscard]] float GetMouseDeltaX() const { return m_mouseDx; }
        [[nodiscard]] float GetMouseDeltaY() const { return m_mouseDy; }
        [[nodiscard]] float GetScrollX() const { return m_scrollX; }
        [[nodiscard]] float GetScrollY() const { return m_scrollY; }

    private:
        std::unordered_map<Key, ButtonState> m_keyStates;
        std::unordered_map<MouseButton, ButtonState> m_mouseButtonStates;
        float m_mouseX{0.0f};
        float m_mouseY{0.0f};
        float m_mouseDx{0.0f};
        float m_mouseDy{0.0f};
        float m_scrollX{0.0f};
        float m_scrollY{0.0f};
    };
}

#endif // PLATFORM_ENGINE_INPUT_INPUT_SNAPSHOT_HPP

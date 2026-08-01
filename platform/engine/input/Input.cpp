#include "engine/input/Input.hpp"
#include "engine/input/InputEvents.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    Input::Input() = default;

    bool Input::Initialize()
    {
        LOG_INFO("[Input] Input subsystem initialized.");
        return true;
    }

    void Input::Shutdown()
    {
        m_keyStates.clear();
        m_mouseButtonStates.clear();
        LOG_INFO("[Input] Input subsystem shutdown.");
    }

    void Input::NewFrame()
    {
        // Calculate mouse deltas for new frame
        m_mouseDx = m_mouseX - m_prevMouseX;
        m_mouseDy = m_mouseY - m_prevMouseY;
        m_prevMouseX = m_mouseX;
        m_prevMouseY = m_mouseY;

        // Reset scroll offsets for new frame
        m_scrollX = 0.0f;
        m_scrollY = 0.0f;

        // Advance key states
        for (auto &[key, state] : m_keyStates)
        {
            if (state == ButtonState::Pressed)
            {
                state = ButtonState::Held;
            }
            else if (state == ButtonState::Released)
            {
                state = ButtonState::Idle;
            }
        }

        // Advance mouse button states
        for (auto &[button, state] : m_mouseButtonStates)
        {
            if (state == ButtonState::Pressed)
            {
                state = ButtonState::Held;
            }
            else if (state == ButtonState::Released)
            {
                state = ButtonState::Idle;
            }
        }
    }

    void Input::OnKeyDown(Key key, bool isRepeat)
    {
        if (key == Key::Unknown)
        {
            return;
        }

        auto &state = m_keyStates[key];
        if (state == ButtonState::Idle || state == ButtonState::Released)
        {
            state = ButtonState::Pressed;
        }
        else if (isRepeat)
        {
            state = ButtonState::Pressed;
        }

        if (m_eventQueue)
        {
            m_eventQueue->Push(std::make_shared<KeyPressedEvent>(key, isRepeat));
        }
    }

    void Input::OnKeyUp(Key key)
    {
        if (key == Key::Unknown)
        {
            return;
        }

        m_keyStates[key] = ButtonState::Released;

        if (m_eventQueue)
        {
            m_eventQueue->Push(std::make_shared<KeyReleasedEvent>(key));
        }
    }

    void Input::OnMouseButtonDown(MouseButton button)
    {
        m_mouseButtonStates[button] = ButtonState::Pressed;

        if (m_eventQueue)
        {
            m_eventQueue->Push(std::make_shared<MouseButtonPressedEvent>(button));
        }
    }

    void Input::OnMouseButtonUp(MouseButton button)
    {
        m_mouseButtonStates[button] = ButtonState::Released;

        if (m_eventQueue)
        {
            m_eventQueue->Push(std::make_shared<MouseButtonReleasedEvent>(button));
        }
    }

    void Input::OnMouseMove(float x, float y)
    {
        m_mouseX = x;
        m_mouseY = y;
        float dx = m_mouseX - m_prevMouseX;
        float dy = m_mouseY - m_prevMouseY;

        if (m_eventQueue)
        {
            m_eventQueue->Push(std::make_shared<MouseMovedEvent>(x, y, dx, dy));
        }
    }

    void Input::OnMouseScroll(float xOffset, float yOffset)
    {
        m_scrollX += xOffset;
        m_scrollY += yOffset;

        if (m_eventQueue)
        {
            m_eventQueue->Push(std::make_shared<MouseScrolledEvent>(xOffset, yOffset));
        }
    }

    std::shared_ptr<const InputSnapshot> Input::CreateSnapshot() const
    {
        return std::make_shared<const InputSnapshot>(
            m_keyStates,
            m_mouseButtonStates,
            m_mouseX, m_mouseY,
            m_mouseDx, m_mouseDy,
            m_scrollX, m_scrollY
        );
    }

    ButtonState Input::GetKeyState(Key key) const
    {
        auto it = m_keyStates.find(key);
        if (it != m_keyStates.end())
        {
            return it->second;
        }
        return ButtonState::Idle;
    }

    bool Input::IsKeyPressed(Key key) const
    {
        return GetKeyState(key) == ButtonState::Pressed;
    }

    bool Input::IsKeyHeld(Key key) const
    {
        auto s = GetKeyState(key);
        return s == ButtonState::Held || s == ButtonState::Pressed;
    }

    bool Input::IsKeyReleased(Key key) const
    {
        return GetKeyState(key) == ButtonState::Released;
    }

    ButtonState Input::GetMouseButtonState(MouseButton button) const
    {
        auto it = m_mouseButtonStates.find(button);
        if (it != m_mouseButtonStates.end())
        {
            return it->second;
        }
        return ButtonState::Idle;
    }

    bool Input::IsMouseButtonPressed(MouseButton button) const
    {
        return GetMouseButtonState(button) == ButtonState::Pressed;
    }

    bool Input::IsMouseButtonHeld(MouseButton button) const
    {
        auto s = GetMouseButtonState(button);
        return s == ButtonState::Held || s == ButtonState::Pressed;
    }

    bool Input::IsMouseButtonReleased(MouseButton button) const
    {
        return GetMouseButtonState(button) == ButtonState::Released;
    }

    void Input::GetMousePosition(float &x, float &y) const
    {
        x = m_mouseX;
        y = m_mouseY;
    }

    void Input::GetMouseDelta(float &dx, float &dy) const
    {
        dx = m_mouseDx;
        dy = m_mouseDy;
    }

    void Input::GetMouseScroll(float &sx, float &sy) const
    {
        sx = m_scrollX;
        sy = m_scrollY;
    }
}

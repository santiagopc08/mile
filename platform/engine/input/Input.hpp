#ifndef PLATFORM_ENGINE_INPUT_INPUT_HPP
#define PLATFORM_ENGINE_INPUT_INPUT_HPP

#include "engine/input/KeyCodes.hpp"
#include "engine/input/InputState.hpp"
#include "engine/input/InputSnapshot.hpp"
#include "engine/events/EventQueue.hpp"
#include <unordered_map>
#include <memory>

namespace platform
{
    class Input
    {
    public:
        Input();

        bool Initialize();
        void Shutdown();

        /// Advance per-frame state transitions (Pressed -> Held, Released -> Idle)
        void NewFrame();

        /// Set event queue for publishing runtime input events
        void SetEventQueue(EventQueue *eventQueue) { m_eventQueue = eventQueue; }

        /// Internal event receivers (called by EventPump)
        void OnKeyDown(Key key, bool isRepeat = false);
        void OnKeyUp(Key key);
        void OnMouseButtonDown(MouseButton button);
        void OnMouseButtonUp(MouseButton button);
        void OnMouseMove(float x, float y);
        void OnMouseScroll(float xOffset, float yOffset);

        /// Create an immutable snapshot for Frame N
        [[nodiscard]] std::shared_ptr<const InputSnapshot> CreateSnapshot() const;

        /// Direct state queries
        [[nodiscard]] ButtonState GetKeyState(Key key) const;
        [[nodiscard]] bool IsKeyPressed(Key key) const;
        [[nodiscard]] bool IsKeyHeld(Key key) const;
        [[nodiscard]] bool IsKeyReleased(Key key) const;

        [[nodiscard]] ButtonState GetMouseButtonState(MouseButton button) const;
        [[nodiscard]] bool IsMouseButtonPressed(MouseButton button) const;
        [[nodiscard]] bool IsMouseButtonHeld(MouseButton button) const;
        [[nodiscard]] bool IsMouseButtonReleased(MouseButton button) const;

        void GetMousePosition(float &x, float &y) const;
        void GetMouseDelta(float &dx, float &dy) const;
        void GetMouseScroll(float &sx, float &sy) const;

    private:
        EventQueue *m_eventQueue{nullptr};

        std::unordered_map<Key, ButtonState> m_keyStates;
        std::unordered_map<MouseButton, ButtonState> m_mouseButtonStates;

        float m_mouseX{0.0f};
        float m_mouseY{0.0f};
        float m_prevMouseX{0.0f};
        float m_prevMouseY{0.0f};
        float m_mouseDx{0.0f};
        float m_mouseDy{0.0f};
        float m_scrollX{0.0f};
        float m_scrollY{0.0f};
    };
}

#endif // PLATFORM_ENGINE_INPUT_INPUT_HPP

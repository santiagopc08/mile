#include "engine/platform/EventPump.hpp"
#include "engine/events/WindowEvents.hpp"
#include "engine/events/ApplicationEvents.hpp"
#include <SDL3/SDL.h>

namespace platform
{
    static Key TranslateSDLKey(SDL_Keycode keycode)
    {
        if (keycode >= SDLK_A && keycode <= SDLK_Z)
        {
            return static_cast<Key>(static_cast<int>(Key::A) + (keycode - SDLK_A));
        }
        if (keycode >= SDLK_0 && keycode <= SDLK_9)
        {
            return static_cast<Key>(static_cast<int>(Key::Num0) + (keycode - SDLK_0));
        }

        switch (keycode)
        {
        case SDLK_F1: return Key::F1;
        case SDLK_F2: return Key::F2;
        case SDLK_F3: return Key::F3;
        case SDLK_F4: return Key::F4;
        case SDLK_F5: return Key::F5;
        case SDLK_F6: return Key::F6;
        case SDLK_F7: return Key::F7;
        case SDLK_F8: return Key::F8;
        case SDLK_F9: return Key::F9;
        case SDLK_F10: return Key::F10;
        case SDLK_F11: return Key::F11;
        case SDLK_F12: return Key::F12;

        case SDLK_UP: return Key::Up;
        case SDLK_DOWN: return Key::Down;
        case SDLK_LEFT: return Key::Left;
        case SDLK_RIGHT: return Key::Right;

        case SDLK_LSHIFT: return Key::LeftShift;
        case SDLK_RSHIFT: return Key::RightShift;
        case SDLK_LCTRL: return Key::LeftCtrl;
        case SDLK_RCTRL: return Key::RightCtrl;
        case SDLK_LALT: return Key::LeftAlt;
        case SDLK_RALT: return Key::RightAlt;

        case SDLK_SPACE: return Key::Space;
        case SDLK_RETURN: return Key::Enter;
        case SDLK_TAB: return Key::Tab;
        case SDLK_BACKSPACE: return Key::Backspace;
        case SDLK_ESCAPE: return Key::Escape;
        case SDLK_DELETE: return Key::Delete;

        default:
            return Key::Unknown;
        }
    }

    static MouseButton TranslateSDLButton(uint8_t button)
    {
        switch (button)
        {
        case SDL_BUTTON_LEFT: return MouseButton::Left;
        case SDL_BUTTON_MIDDLE: return MouseButton::Middle;
        case SDL_BUTTON_RIGHT: return MouseButton::Right;
        case SDL_BUTTON_X1: return MouseButton::X1;
        case SDL_BUTTON_X2: return MouseButton::X2;
        default: return MouseButton::Left;
        }
    }

    void EventPump::Poll(EventQueue &eventQueue, Input &input)
    {
        input.NewFrame();

        SDL_Event event;
        while (SDL_PollEvent(&event))
        {
            switch (event.type)
            {
            case SDL_EVENT_QUIT:
            {
                eventQueue.Push(std::make_shared<ApplicationClosingEvent>());
                eventQueue.Push(std::make_shared<WindowClosedEvent>());
                break;
            }

            case SDL_EVENT_WINDOW_CLOSE_REQUESTED:
            {
                eventQueue.Push(std::make_shared<WindowClosedEvent>());
                break;
            }

            case SDL_EVENT_WINDOW_RESIZED:
            case SDL_EVENT_WINDOW_PIXEL_SIZE_CHANGED:
            {
                eventQueue.Push(std::make_shared<WindowResizedEvent>(
                    event.window.data1,
                    event.window.data2
                ));
                break;
            }

            case SDL_EVENT_WINDOW_FOCUS_GAINED:
            {
                eventQueue.Push(std::make_shared<WindowFocusedEvent>());
                break;
            }

            case SDL_EVENT_WINDOW_FOCUS_LOST:
            {
                eventQueue.Push(std::make_shared<WindowLostFocusEvent>());
                break;
            }

            case SDL_EVENT_KEY_DOWN:
            {
                Key k = TranslateSDLKey(event.key.key);
                input.OnKeyDown(k, event.key.repeat);
                break;
            }

            case SDL_EVENT_KEY_UP:
            {
                Key k = TranslateSDLKey(event.key.key);
                input.OnKeyUp(k);
                break;
            }

            case SDL_EVENT_MOUSE_BUTTON_DOWN:
            {
                MouseButton b = TranslateSDLButton(event.button.button);
                input.OnMouseButtonDown(b);
                break;
            }

            case SDL_EVENT_MOUSE_BUTTON_UP:
            {
                MouseButton b = TranslateSDLButton(event.button.button);
                input.OnMouseButtonUp(b);
                break;
            }

            case SDL_EVENT_MOUSE_MOTION:
            {
                input.OnMouseMove(event.motion.x, event.motion.y);
                break;
            }

            case SDL_EVENT_MOUSE_WHEEL:
            {
                input.OnMouseScroll(event.wheel.x, event.wheel.y);
                break;
            }

            default:
                break;
            }
        }
    }
}

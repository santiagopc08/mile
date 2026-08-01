#ifndef PLATFORM_ENGINE_INPUT_ACTIONS_ACTION_MAP_HPP
#define PLATFORM_ENGINE_INPUT_ACTIONS_ACTION_MAP_HPP

#include "engine/input/actions/InputBinding.hpp"
#include <vector>

namespace platform
{
    class ActionMap
    {
    public:
        ActionMap();

        static ActionMap CreateDefault();

        void AddBinding(Key primaryKey, InputAction action, Key secondaryKey = Key::Unknown);
        void ClearBindings();

        [[nodiscard]] const std::vector<InputBinding> &GetBindings() const { return m_bindings; }

    private:
        std::vector<InputBinding> m_bindings;
    };
}

#endif // PLATFORM_ENGINE_INPUT_ACTIONS_ACTION_MAP_HPP

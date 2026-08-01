#ifndef PLATFORM_ENGINE_MODULES_MODULE_REGISTRY_HPP
#define PLATFORM_ENGINE_MODULES_MODULE_REGISTRY_HPP

#include "engine/modules/IModule.hpp"
#include <memory>
#include <vector>
#include <string_view>

namespace platform
{
    class ModuleRegistry
    {
    public:
        ModuleRegistry() = default;

        bool RegisterModule(std::shared_ptr<IModule> module);
        bool InitializeModules();
        void UpdateModules(double dt);
        void ShutdownModules();

        [[nodiscard]] IModule *GetModule(std::string_view name) const;
        [[nodiscard]] size_t GetModuleCount() const { return m_modules.size(); }

    private:
        void SortModulesByPriority();

        std::vector<std::shared_ptr<IModule>> m_modules;
        std::vector<std::shared_ptr<IModule>> m_initializedModules;
    };
}

#endif // PLATFORM_ENGINE_MODULES_MODULE_REGISTRY_HPP

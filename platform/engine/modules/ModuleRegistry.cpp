#include "engine/modules/ModuleRegistry.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    bool ModuleRegistry::RegisterModule(std::shared_ptr<IModule> module)
    {
        if (!module) return false;

        const auto &desc = module->GetDescriptor();
        for (const auto &existing : m_modules)
        {
            if (existing->GetDescriptor().Name == desc.Name)
            {
                LOG_WARN("[ModuleRegistry] Module '{}' is already registered.", desc.Name);
                return false;
            }
        }

        m_modules.push_back(module);
        LOG_INFO("[ModuleRegistry] Registered module '{}' (Priority: {}).", desc.Name, desc.Priority);
        return true;
    }

    void ModuleRegistry::SortModulesByPriority()
    {
        std::sort(m_modules.begin(), m_modules.end(), [](const auto &a, const auto &b) {
            return a->GetDescriptor().Priority > b->GetDescriptor().Priority;
        });
    }

    bool ModuleRegistry::InitializeModules()
    {
        SortModulesByPriority();

        for (auto &module : m_modules)
        {
            const auto &desc = module->GetDescriptor();
            LOG_INFO("[ModuleRegistry] Configuring module '{}'...", desc.Name);
            module->Configure();

            LOG_INFO("[ModuleRegistry] Initializing module '{}'...", desc.Name);
            if (!module->Initialize())
            {
                LOG_ERROR("[ModuleRegistry] Module '{}' initialization failed! Executing atomic rollback...", desc.Name);
                ShutdownModules();
                return false;
            }

            m_initializedModules.push_back(module);
        }

        LOG_INFO("[ModuleRegistry] All {} modules initialized successfully.", m_initializedModules.size());
        return true;
    }

    void ModuleRegistry::UpdateModules(double dt)
    {
        for (auto &module : m_initializedModules)
        {
            module->Update(dt);
        }
    }

    void ModuleRegistry::ShutdownModules()
    {
        LOG_INFO("[ModuleRegistry] Shutting down initialized modules in reverse priority order...");
        for (auto it = m_initializedModules.rbegin(); it != m_initializedModules.rend(); ++it)
        {
            if (*it)
            {
                LOG_INFO("[ModuleRegistry] Shutting down module '{}'...", (*it)->GetDescriptor().Name);
                (*it)->Shutdown();
            }
        }
        m_initializedModules.clear();
    }

    IModule *ModuleRegistry::GetModule(std::string_view name) const
    {
        for (const auto &module : m_modules)
        {
            if (module->GetDescriptor().Name == name)
            {
                return module.get();
            }
        }
        return nullptr;
    }
}

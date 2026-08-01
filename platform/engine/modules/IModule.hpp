#ifndef PLATFORM_ENGINE_MODULES_IMODULE_HPP
#define PLATFORM_ENGINE_MODULES_IMODULE_HPP

#include "engine/modules/ModuleDescriptor.hpp"
#include "engine/modules/ModuleState.hpp"
#include <string>

namespace platform
{
    struct ModuleDiagnostics
    {
        size_t MemoryUsageBytes{0};
        double ExecutionTimeMs{0.0};
        bool Healthy{true};
    };

    class IModule
    {
    public:
        virtual ~IModule() = default;

        virtual bool Initialize() = 0;
        virtual void Shutdown() = 0;
        virtual void Update(double dt) = 0;
        virtual void Configure() = 0;

        [[nodiscard]] virtual const ModuleDescriptor &GetDescriptor() const = 0;
        [[nodiscard]] virtual ModuleState GetState() const = 0;
        [[nodiscard]] virtual ModuleDiagnostics GetDiagnostics() const = 0;
    };
}

#endif // PLATFORM_ENGINE_MODULES_IMODULE_HPP

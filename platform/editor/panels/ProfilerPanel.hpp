#ifndef PLATFORM_EDITOR_PANELS_PROFILER_PANEL_HPP
#define PLATFORM_EDITOR_PANELS_PROFILER_PANEL_HPP

#include "editor/panels/EditorPanel.hpp"

namespace platform
{
    class ProfilerPanel : public EditorPanel
    {
    public:
        ProfilerPanel();

        void OnRender(EditorContext &context) override;
        [[nodiscard]] const std::string &GetName() const override { return m_name; }

    private:
        std::string m_name{"Profiler"};
    };
}

#endif // PLATFORM_EDITOR_PANELS_PROFILER_PANEL_HPP

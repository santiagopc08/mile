#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>

#include "engine/ui/UIManager.hpp"
#include "engine/ui/Canvas.hpp"
#include "engine/ui/widgets/Widget.hpp"
#include "engine/ui/widgets/Panel.hpp"
#include "engine/ui/widgets/Label.hpp"
#include "engine/ui/widgets/ProgressBar.hpp"
#include "engine/ui/widgets/Button.hpp"
#include "engine/ui/widgets/Container.hpp"
#include "engine/ui/hud/HUDManager.hpp"
#include "engine/ui/screens/ScreenManager.hpp"
#include "engine/ui/notifications/NotificationManager.hpp"
#include "engine/ui/theme/ThemeManager.hpp"
#include "engine/ui/animation/UIAnimator.hpp"
#include "examples/hill_climb/PresentationValidationScene.hpp"

TEST_CASE("UIManager and Canvas Initialization", "[Presentation]")
{
    platform::UIManager uiManager;
    REQUIRE(uiManager.Initialize());

    platform::Canvas *hudCanvas = uiManager.CreateCanvas("HUD", platform::UILayer::HUD);
    REQUIRE(hudCanvas != nullptr);
    REQUIRE(hudCanvas->GetName() == "HUD");

    auto panel = std::make_shared<platform::Panel>("TestPanel");
    panel->SetSize(glm::vec2(100.0f, 50.0f));
    hudCanvas->AddWidget(panel);

    REQUIRE(hudCanvas->GetTotalWidgetCount() == 1);
    REQUIRE(uiManager.GetTotalWidgetCount() == 1);

    uiManager.Shutdown();
}

TEST_CASE("Widget Composition and Visibility Propagation", "[Presentation]")
{
    auto parent = std::make_shared<platform::Panel>("ParentPanel");
    auto child = std::make_shared<platform::Label>("ChildLabel", "Hello");

    parent->AddChild(child);

    REQUIRE(parent->GetChildren().size() == 1);
    REQUIRE(child->GetParent() == parent.get());
    REQUIRE(child->IsVisible() == true);

    parent->SetVisible(false);
    REQUIRE(child->IsVisible() == false); // Visibility propagates!
}

TEST_CASE("Container Layout Calculation", "[Presentation]")
{
    auto container = std::make_shared<platform::Container>("VContainer");
    container->SetLayoutMode(platform::LayoutMode::Vertical);
    container->SetSpacing(10.0f);
    container->SetPadding(5.0f);

    auto item1 = std::make_shared<platform::Widget>("Item1");
    item1->SetSize(glm::vec2(50.0f, 20.0f));

    auto item2 = std::make_shared<platform::Widget>("Item2");
    item2->SetSize(glm::vec2(50.0f, 30.0f));

    container->AddChild(item1);
    container->AddChild(item2);

    REQUIRE(item1->GetPosition().y == Catch::Approx(5.0f));
    REQUIRE(item2->GetPosition().y == Catch::Approx(35.0f)); // 5 + 20 + 10 = 35
}

TEST_CASE("HUDManager ViewModel Binding", "[Presentation]")
{
    platform::UIManager uiManager;
    uiManager.Initialize();

    platform::HUDManager hudManager;
    REQUIRE(hudManager.Initialize(uiManager));

    platform::HUDViewModel vm;
    vm.FuelPercent = 0.64f;
    vm.SpeedKmh = 58.0f;
    vm.DistanceMeters = 2842.0f;
    vm.CoinCount = 128;
    vm.TotalScore = 12470;
    vm.IsPaused = false;

    hudManager.Update(vm, 0.016);
    REQUIRE(hudManager.GetViewModel().FuelPercent == Catch::Approx(0.64f));
    REQUIRE(hudManager.GetViewModel().CoinCount == 128);

    uiManager.Shutdown();
}

TEST_CASE("ScreenManager Transitions", "[Presentation]")
{
    class TestScreen : public platform::Screen
    {
    public:
        explicit TestScreen(platform::ScreenType type) : Screen(type, "TestScreen") {}
    };

    platform::ScreenManager screenManager;
    screenManager.RegisterScreen(std::make_unique<TestScreen>(platform::ScreenType::MainMenu));
    screenManager.RegisterScreen(std::make_unique<TestScreen>(platform::ScreenType::Gameplay));

    REQUIRE(screenManager.TransitionTo(platform::ScreenType::MainMenu, platform::TransitionType::None));
    REQUIRE(screenManager.GetActiveScreen() != nullptr);
    REQUIRE(screenManager.GetActiveScreen()->GetType() == platform::ScreenType::MainMenu);

    REQUIRE(screenManager.TransitionTo(platform::ScreenType::Gameplay, platform::TransitionType::FadeIn, 0.1));
    REQUIRE(screenManager.IsTransitioning());

    screenManager.Update(0.15); // Complete transition
    REQUIRE(!screenManager.IsTransitioning());
    REQUIRE(screenManager.GetActiveScreen()->GetType() == platform::ScreenType::Gameplay);
}

TEST_CASE("NotificationManager Queue Lifecycle", "[Presentation]")
{
    platform::UIManager uiManager;
    uiManager.Initialize();

    platform::NotificationManager notifManager;
    REQUIRE(notifManager.Initialize(uiManager, 2));

    platform::Notification n1;
    n1.Title = "Checkpoint 1";
    n1.DurationSeconds = 1.0;

    platform::Notification n2;
    n2.Title = "Checkpoint 2";
    n2.DurationSeconds = 1.0;

    notifManager.Push(n1);
    notifManager.Push(n2);

    notifManager.Update(0.016);
    REQUIRE(notifManager.GetActiveCount() == 2);

    uiManager.Shutdown();
}

TEST_CASE("ThemeManager Switching", "[Presentation]")
{
    platform::ThemeManager themeManager;
    REQUIRE(themeManager.GetActiveMode() == platform::ThemeMode::Dark);

    themeManager.SetTheme(platform::ThemeMode::Light);
    REQUIRE(themeManager.GetActiveMode() == platform::ThemeMode::Light);
    REQUIRE(themeManager.GetActiveTheme().Name == "Light Clean");
}

TEST_CASE("UIAnimator Animation Progress", "[Presentation]")
{
    auto widget = std::make_shared<platform::Widget>("AnimWidget");
    widget->SetPosition(glm::vec2(0.0f, 0.0f));

    platform::UIAnimation anim;
    anim.Type = platform::AnimationType::Slide;
    anim.StartVector = glm::vec2(0.0f, 0.0f);
    anim.TargetVector = glm::vec2(100.0f, 200.0f);
    anim.DurationSeconds = 1.0;

    platform::UIAnimator animator;
    animator.Play(widget, anim);

    REQUIRE(animator.IsPlaying(widget));

    animator.Update(0.5); // Halfway
    REQUIRE(widget->GetPosition().x == Catch::Approx(50.0f));
    REQUIRE(widget->GetPosition().y == Catch::Approx(100.0f));

    animator.Update(0.6); // Finish
    REQUIRE(!animator.IsPlaying(widget));
}

TEST_CASE("PresentationValidationScene Lifecycle", "[PresentationScene]")
{
    platform::PresentationValidationScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    REQUIRE(scene.IsActive());
    REQUIRE(scene.GetUIManager().IsInitialized());
    REQUIRE(scene.GetHUDManager().IsInitialized());

    scene.Update(0.016);

    scene.Deactivate();
    scene.Shutdown();
}

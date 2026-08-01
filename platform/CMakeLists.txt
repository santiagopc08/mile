cmake_minimum_required(VERSION 3.28)

project(
    Platform
    VERSION 0.1.0
    DESCRIPTION "ORBIT Interactive Application Platform"
    LANGUAGES CXX
)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Global Options
option(PLATFORM_BUILD_TESTS "Build test suite" ON)
option(PLATFORM_BUILD_EXAMPLES "Build example applications" ON)
option(PLATFORM_ENABLE_WARNINGS "Enable compiler warnings" ON)
option(PLATFORM_WARNINGS_AS_ERRORS "Treat warnings as errors" OFF)
option(PLATFORM_ENABLE_PROFILING "Enable profiling" OFF)

# Output directories
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# Include Modules
include(cmake/CompilerWarnings.cmake)
include(cmake/Dependencies.cmake)

add_subdirectory(engine)
add_subdirectory(editor)

if(PLATFORM_BUILD_EXAMPLES)
    add_subdirectory(examples/hill_climb)
endif()

if(PLATFORM_BUILD_TESTS)
    add_subdirectory(tests)
endif()

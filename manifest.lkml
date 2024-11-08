application: custom_viz {
  label: "Custom Viz"
  url: "https://localhost:8080/bundle.js"
  entitlements: {
    local_storage: yes
    core_api_methods: ["me", "dashboard", "run_query"]
    external_api_urls: []
  }

  mount_points: {
    dashboard_vis: yes
    dashboard_tile: no
    standalone: no
  }
}

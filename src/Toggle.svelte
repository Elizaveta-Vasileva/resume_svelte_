<!-- Toggle.svelte -->

<script>
    export const darkMode = false;
  export let toggleMode;

  </script>
  
  <label class="switch">
    <input type="checkbox" on:change={toggleMode}>
    <span class="slider"></span>
    </label>
  
  <style>
    /* Toggle switch styles */
    .switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
    }
  
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
  
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc; /* Default background color */
      -webkit-transition: .4s;
      transition: .4s;
      border-radius: 34px;
    }
  
    .slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white; /* Default toggle color */
      -webkit-transition: .4s;
      transition: .4s;
      border-radius: 50%;
    }
  
    input:checked + .slider {
      background-color: #2196F3; /* Toggle background color in dark mode */
    }
  
    input:checked + .slider:before {
      -webkit-transform: translateX(26px);
      -ms-transform: translateX(26px);
      transform: translateX(26px);
    }
  </style>
  
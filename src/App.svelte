<!-- App.svelte -->
<script>
	import Header from './Header.svelte';
	import ContactInfo from './ContactInfo.svelte';
	import CodingLanguages from './CodingLanguages.svelte';
	import Languages from './Languages.svelte';
	import Hobbies from './Hobbies.svelte';
	import Objective from './Objective.svelte';
	import Education from './Education.svelte';
	import Experience from './Experience.svelte';
	import Projects from './Projects.svelte';
	import Toggle from './Toggle.svelte';
	
	let darkMode = false;

	function toggleMode() {
	  darkMode = !darkMode;
	  // Apply dark mode class to :root element
	  document.documentElement.classList.toggle('dark-mode', darkMode);
	}
</script>

<link rel="stylesheet" href="global.css">

<main class="flex gap-x-10 mt-10">
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>CV Vasileva Elizaveta</title>
		<link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
	</head>

	<body class="flex justify-center content-center">
		<div class="border border-gray-300 rounded-sm shadow-lg py-10 px-10 w-4/5 mt-10 mb-10">
			<Header />

			<div class="flex">
				<div class="w-2/6">
					<section id="contact">
						<h2>Contact Information</h2>
						<ContactInfo />
					</section>
	  
					<section id="coding-languages">
						<h2>Coding Languages</h2>
						<CodingLanguages />
					</section>
	  
					<section id="languages">
						<h2>Languages</h2>
						<Languages />
					</section>
	  
					<section id="hobbies">
						<h2>Hobbies</h2>
						<Hobbies />
					</section>
				</div>

				<div class="w-4/6">
					<section id="objective">
						<h2>Objective</h2>
						<Objective />
					</section>
	  
					<section id="education">
						<h2>Education</h2>
						<Education />
					</section>
	  
					<section id="experience">
						<h2>Experience</h2>
						<Experience />
					</section>
	  
					<section id="projects">
						<h2>Projects</h2>
						<Projects />
					</section>

					<div class="mode-toggle">
						<Toggle {darkMode} {toggleMode} />
					</div>
				</div>
			</div>
		</div>	
	</body>	
</main>

<!-- App.svelte -->

<style>
	/* Default light mode colors */
	:root {
		--bg-color: #fff;
		--text-color: #333;
	}

	/* Dark mode colors */
	:root.dark-mode {
		--bg-color: #333;
		--text-color: #fff;
	}

	body {
		background-color: var(--bg-color);
		color: var(--text-color);
		transition: background-color 0.3s ease, color 0.3s ease;
	}
</style>

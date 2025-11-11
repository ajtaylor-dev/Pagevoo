<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pagevoo App</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body>
    <div id="root"></div>

    <!-- React App - Development Mode -->
    @if(config('app.env') === 'local')
        <script type="module" src="http://localhost:5175/@vite/client"></script>
        <script type="module" src="http://localhost:5175/src/main.tsx"></script>
    @else
        <!-- Production Build -->
        @vite(['resources/js/app.js'])
    @endif
</body>
</html>

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>Nurul Huda Payment - An-Najjah</title>

    <!-- Meta Description -->
    <meta name="description" content="Sistem Pembayaran Pondok Pesantren Nurul Huda An-Najjah">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="{{ asset('logo pondok.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('logo pondok.png') }}">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=montserrat:400,500,600,700" rel="stylesheet" />

    <!-- PWA -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#16a34a">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.jsx'])

    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js');
            });
        }
    </script>
</head>

<body class="antialiased">
    <div id="app"></div>
</body>

</html>

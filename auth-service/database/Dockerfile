# Imagen base: PHP con apache (para Laravel)
FROM php:8.1-apache

# Instalar dependencias del sistema necesarias para desarrollo
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    zip \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libpq-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libicu-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    pkg-config \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        pdo_pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        intl \
        zip \
        opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar Composer globalmente
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Directorio de trabajo
WORKDIR /var/www/html

# Copiar archivos del proyecto (en dev se suele usar volumen, así que no copiamos todos)
COPY . .

# Instalar dependencias de PHP (con dev, útil para testing)
RUN composer install --no-interaction --prefer-dist

# Exponer el puerto del servidor apache
EXPOSE 80

# Conf apache
COPY default.conf /etc/apache2/sites-availables/000-default.conf

RUN a2enmod rewrite

# Ajustar permisos
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# Comando por defecto
# CMD ["apache2-foreground"]

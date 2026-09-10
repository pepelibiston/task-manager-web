
# Imagen base con Apache y PHP 8.4
FROM php:8.4-apache

# ============================================================
# Dependencias del sistema y extensiones PHP
# ============================================================
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
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================================
# Composer
# ============================================================
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ============================================================
# Directorio de Laravel
# ============================================================
WORKDIR /var/www/html

# Copiar aplicación
COPY . .

# IMPORTANTE:
# NO ejecutar composer install aquí.
#
# Composer puede ejecutar package:discover y Laravel carga
# config/jwt.php antes de que existan las claves JWT y .env.
#
# composer install se ejecutará posteriormente desde CI,
# cuando el contenedor ya tenga .env y las claves.

# ============================================================
# Entrypoint
# ============================================================
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

# ============================================================
# Apache
# ============================================================
RUN a2enmod rewrite

COPY default.conf /etc/apache2/sites-available/000-default.conf

EXPOSE 80

CMD ["apache2-foreground"]

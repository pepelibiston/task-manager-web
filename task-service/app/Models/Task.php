<?php

namespace App\Models;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{

    protected $fillable = [
        'title',
        'description',
        'user_id',
        'priority',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'priority' => TaskPriority::class,
            'status' => TaskStatus::class,
        ];
    }
}

<?php

namespace App\Services;

use RdKafka\Conf;
use RdKafka\Producer;

class KafkaProducerService
{
    private Producer $producer;

    public function __construct()
    {
        $conf = new Conf();

        $conf->set(
            'metadata.broker.list',
            env('KAFKA_BROKERS', 'kafka:9092')
        );

        $this->producer = new Producer($conf);
    }

    public function send(string $topicName, string $message): void
    {
        $topic = $this->producer->newTopic($topicName);

        $topic->produce(
            RD_KAFKA_PARTITION_UA,
            0,
            $message
        );

        $this->producer->flush(5000);
    }
}
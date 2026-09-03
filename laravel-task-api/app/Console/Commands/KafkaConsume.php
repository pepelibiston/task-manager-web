<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use RdKafka\Conf;
use RdKafka\KafkaConsumer;

class KafkaConsume extends Command
{
    protected $signature = 'kafka:consume';

    protected $description = 'Consume mensajes desde Kafka';

    public function handle(): int
    {
        $conf = new Conf();

        $conf->set(
            'metadata.broker.list',
            env('KAFKA_BROKERS', 'kafka:9092')
        );

        $conf->set(
            'group.id',
            'task-service'
        );

        $conf->set(
            'auto.offset.reset',
            'earliest'
        );

        $consumer = new KafkaConsumer($conf);

        $consumer->subscribe([
            'test-topic'
        ]);

        $this->info('Esperando mensajes de Kafka...');

        while (true) {
            $message = $consumer->consume(1000);

            switch ($message->err) {

                case RD_KAFKA_RESP_ERR_NO_ERROR:

                    $this->info(
                        'Mensaje recibido: ' . $message->payload
                    );

                    break;

                case RD_KAFKA_RESP_ERR__PARTITION_EOF:

                case RD_KAFKA_RESP_ERR__TIMED_OUT:

                    break;

                default:

                    $this->error(
                        'Error: ' . $message->errstr()
                    );

                    break;
            }
        }

        return self::SUCCESS;
    }
}
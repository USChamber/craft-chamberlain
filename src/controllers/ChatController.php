<?php

namespace USChamber\Chamberlain\controllers;

use Craft;
use craft\web\Controller;
use yii\web\Response;

class ChatController extends Controller
{
    protected array|int|bool $allowAnonymous = true;
    public $enableCsrfValidation = false;

    public function actionIndex(): Response
    {
//        $entryId = Craft::$app->getRequest()->getParam('entryId');
        $message = Craft::$app->getRequest()->getParam('message');
        $skipDelay = Craft::$app->getRequest()->getParam('skipDelay', false);
        if (!$skipDelay) {
            sleep(1);
        }
        if (empty($message)) {
            return $this->asJson([
                'error' => 'Message cannot be empty.',
            ]);
        }
        $responseKey = $this->mapResponses[$message] ?? null;
        $response = $this->responses[$responseKey] ?? null;
        if (!$response) {
            return $this->asJson([
                'error' => 'No response found for the given message.',
                'message' => $message,
            ]);
        }

        return $this->asJson(array_merge(
            $response,
            [
                'status' => 'success',
            ]
        ));
    }

    public array $mapResponses = [
        'initiation' => 'response1',
        'I want to know more about how tariffs might affect my business' => 'redirect1',
    ];

    public array $responses = [
        'response1' => [
            'message' => 'Hello! How can I assist you today?',
            'options' => [
                'I want the latest information on tariffs',
                'I want to know more about how tariffs might affect my business',
                'I want more general information about recent policy issues',
            ],
            'responseType' => 'options',
        ],
        'redirect1' => [
            'responseType' => 'redirect',
            'message' => 'Ok, let\'s check it out on our sister-site, CO—.',
            'options' => // this is stupid but it works with the frontend for now
                [
                    'https://co.ddev.site/events/small-business-update/small-business-update-one-big-beautiful-bill-taxes-and-tariffs'
                ],
        ],
        'response2' => [
            'message' => 'I’m here to help you make the most of our resources and tools for businesses. Which would you like to explore next?',
            'options' => [
                'More content on policy issues affecting my business',
                'Opportunities to share my business story with the U.S. Chamber',
                'Free virtual events for small businesses',
            ],
            'responseType' => 'options',
        ]
    ];
}
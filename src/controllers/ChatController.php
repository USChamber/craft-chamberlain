<?php

namespace USChamber\Chamberlain\controllers;

use Craft;
use craft\web\Controller;
use Exception;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use yii\web\Response;

class ChatController extends Controller
{
    protected array|int|bool $allowAnonymous = true;
    public $enableCsrfValidation = false;

    public function actionIndex(): Response
    {
        $previousState = Craft::$app->getRequest()->getParam('previousState');
        $lambdaResponse = $this->makeLambdaRequest($previousState);

        $skipDelay = Craft::$app->getRequest()->getParam('skipDelay', false);
        if (!$skipDelay) {
            sleep(1);
        }

        return $this->asJson([
                'status' => 'success',
                'response' => $lambdaResponse['response'],
                'currentState' => $lambdaResponse['currentState'],
            ]
        );
    }

    private function makeLambdaRequest($previousState = null): array
    {
        // Create a Guzzle HTTP client
        $client = new Client();

        // Base URL
        $baseUrl = 'https://m4jaysd4n5kt4cf5dbdesip3240ibtuj.lambda-url.us-east-1.on.aws/';

        try {
            $options = [
                'timeout' => 30, // 30 second timeout
                'headers' => [
                    'Accept' => 'application/json',
                    'User-Agent' => 'PHP-Guzzle-Client'
                ]
            ];
            // Add query parameters if needed
            if (!empty($previousState)) {
                $options['query'] = [
                    'previousState' => $previousState
                ];
            }
            // Make the GET request with query parameters
            $response = $client->request('GET', $baseUrl, $options);

            // Get the response body as a string
            $jsonResponse = $response->getBody()->getContents();

            // Convert JSON to PHP array
            $arrayResponse = json_decode($jsonResponse, true, 512, JSON_THROW_ON_ERROR);

            // Check if JSON decoding was successful
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \RuntimeException('JSON decode error: ' . json_last_error_msg());
            }

            return [
                'success' => true,
                'data' => $arrayResponse,
                'status_code' => $response->getStatusCode()
            ];

        } catch (RequestException $e) {
            // Handle HTTP errors
            return [
                'success' => false,
                'error' => 'Request failed: ' . $e->getMessage(),
                'status_code' => $e->hasResponse() ? $e->getResponse()->getStatusCode() : null
            ];

        } catch (Exception $e) {
            // Handle other errors (like JSON decode errors)
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'status_code' => null
            ];
        }
    }
}
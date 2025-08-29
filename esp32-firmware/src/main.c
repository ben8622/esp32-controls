#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_log.h"
#include "driver/uart.h"
#include "string.h"
#include "driver/gpio.h"
#include <stdio.h>
#include "esp_wifi.h"
#include "esp_mac.h"
#include "nvs_flash.h"
#include "esp_now.h"

static const char* TAG = "ESP-NOW TX";
static const int RX_BUF_SIZE = 1024;
static const uint8_t rcvr_esp_mac[6] = {0xec,0xe3,0x34,0xd3,0x2a,0xcc};

#define TXD_PIN (GPIO_NUM_1) 
#define RXD_PIN (GPIO_NUM_3) 
#define UART_NUM (UART_NUM_1) // ran into issues trying to use uart_0 since

/// @brief Initializes the wifi / networking components which is required for ESPNOW.
void wifi_sta_init(void) 
{
  // initialize the 'Non-Volatile Storage" partition in flash memory
  esp_err_t nvs_flash_init_ret = nvs_flash_init();
  if(nvs_flash_init_ret == ESP_ERR_NVS_NO_FREE_PAGES || nvs_flash_init_ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
      ESP_LOGI(TAG, "Error initializing NVS, erasing flash memory and reinitializing");
      nvs_flash_erase();
      nvs_flash_init();
  }

  // Initialize the TCP/IP networking stack
  esp_err_t esp_netif_init_ret = esp_netif_init();
  if(esp_netif_init_ret == ESP_FAIL) {
      ESP_LOGI(TAG, "Error initializing NETIF");
  }

  // create event loop, allowing other components to register handlers
  esp_err_t event_loop_create_ret =  esp_event_loop_create_default();
  if(event_loop_create_ret == ESP_FAIL) {
          ESP_LOGI(TAG, "Error initializing default event loop");
  }

  // set wifi config to default, set mode/storage/powersave, and start the wifi
  wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
  esp_wifi_init(&cfg);
  esp_wifi_set_mode(WIFI_MODE_STA);
  esp_wifi_set_storage(WIFI_STORAGE_RAM);
  esp_wifi_set_ps(WIFI_PS_NONE);
  esp_wifi_start();

  // set the wifi channels, must be called after `esp_wifi_start()`
  esp_wifi_set_channel(1, WIFI_SECOND_CHAN_NONE);

  // log the mac address of this esp32, useful for any devices that need to connect
    uint8_t esp_mac[6];
    esp_read_mac(esp_mac, ESP_MAC_WIFI_STA);
    ESP_LOGI(TAG, "mac " MACSTR "", esp_mac[0], esp_mac[1], esp_mac[2], esp_mac[3], esp_mac[4], esp_mac[5]);
}

/// @brief Callback function for when the ESP32 sends data over ESPNOW
/// @param tx_info Information of the transmission
/// @param status Status enum if the send worked
void esp_now_send_callback(const wifi_tx_info_t * tx_info, esp_now_send_status_t status) 
{
   ESP_LOGI(TAG, "status: %d", status);
}

/// @brief Inititalizes the UART peripheral with the specified settings.
void uart_init(void)
{
    const uart_config_t uart_config = {
        .baud_rate = 115200,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_DEFAULT,
    };
    // We won't use a buffer for sending data.
    ESP_ERROR_CHECK(uart_driver_install(UART_NUM, RX_BUF_SIZE * 2, 0, 0, NULL, 0));
    ESP_ERROR_CHECK(uart_param_config(UART_NUM, &uart_config));
    ESP_ERROR_CHECK(uart_set_pin(UART_NUM, TXD_PIN, RXD_PIN, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE));
}

int txDataUart(const char* logName, const uint8_t* data, const int len)
{
    const int txBytes = uart_write_bytes(UART_NUM_1, data, len);
    ESP_LOGI(logName, "Wrote %d bytes", txBytes);
    return txBytes;
}

static void tx_task(void *arg)
{
    static const char *TX_TASK_TAG = "TX_TASK";
    esp_log_level_set(TX_TASK_TAG, ESP_LOG_INFO);
    while (1) {
        const char* message = "heartbeat";
        const uint8_t* buffer = (const uint8_t*)message;
        txDataUart(TX_TASK_TAG, buffer, strlen(message));
        vTaskDelay(10000 / portTICK_PERIOD_MS);
    }
}

static void rx_task(void *arg)
{
    static const char *RX_TASK_TAG = "RX_TASK";
    esp_log_level_set(RX_TASK_TAG, ESP_LOG_INFO);
    uint8_t* data = (uint8_t*) malloc(RX_BUF_SIZE + 1);
    while (1) {
        const int rxBytes = uart_read_bytes(UART_NUM_1, data, RX_BUF_SIZE, 1000 / portTICK_PERIOD_MS);
        if (rxBytes > 0) {
            data[rxBytes] = 0;
            ESP_LOGI(RX_TASK_TAG, "Read %d bytes: '%s'", rxBytes, data);

            // echo back to sender
            txDataUart(RX_TASK_TAG, data, rxBytes);

            // transmit over ESPNOW
            esp_err_t err = esp_now_send(rcvr_esp_mac, data, rxBytes);

            ESP_LOG_BUFFER_HEXDUMP(RX_TASK_TAG, data, rxBytes, ESP_LOG_INFO);
        }
    }
    free(data);
}

void app_main(void)
{
    // initialize ESPNOW
    wifi_sta_init();
    esp_now_init();
    esp_now_register_send_cb(esp_now_send_callback);
    esp_now_peer_info_t peer_info = {0};
    peer_info.channel = 1; 
    peer_info.encrypt = false;
    memcpy(peer_info.peer_addr, rcvr_esp_mac, 6);
    esp_err_t add_peer_status =  esp_now_add_peer(&peer_info);

    // initialize the UART connection
    uart_init();

    // start the UART rx and tx tasks
    xTaskCreate(rx_task, "uart_rx_task", 3072, NULL, configMAX_PRIORITIES - 1, NULL);
    xTaskCreate(tx_task, "uart_tx_task", 3072, NULL, configMAX_PRIORITIES - 2, NULL);
}
<template>
    <div>
        <h2>Lista de eventos</h2>
        <ul>
            <li f-for="event  in events" :key="event.title">

            </li>
        </ul>
    </div>
</template>